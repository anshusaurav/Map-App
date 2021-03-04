import React from 'react'
import ReactDOM from 'react-dom'
import ReactMapGL, {Marker, NavigationControl} from 'react-map-gl'
import debounce from 'tiny-debounce'
import CityPin from './CityPin'
import { Input, Ul, Li, SuggestContainer } from "./style"
import cx from 'classnames';
class Home extends React.Component {
  state = {
    isOpen: false, start: null, name: '', suggestions: null, city: null, mappedCities: null, viewport: {
      width: window.innerWidth-80,
      height: window.innerHeight - 220,
      zoom: 2,
    }, loading: false, visible: false, isNear: true
  }

  setViewportSizeState = () => {
    const viewport = {...this.state.viewport}
    if (this.parentNode) {
      const {width, height} = this.parentNode.getBoundingClientRect()
      viewport.width = width-10;
      viewport.height = height- 10;
      this.setState({viewport})
    }
  }
  windowResizeHandler = () => this.setViewportSizeState()

  debouncedWindowResizeHandler = debounce(this.windowResizeHandler, 300)

  componentDidMount() {
    this.parentNode = ReactDOM.findDOMNode(this).parentNode
    this.setViewportSizeState()
    window.addEventListener('resize', this.debouncedWindowResizeHandler)

  }
  handleToggle = () =>{
    if(!this.state.city)
      return;
    const {id} = this.state.city;

    this.setState({isNear: !this.state.isNear}, () =>{
      const url = `https://childlike-wool-venom.glitch.me/cities`
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId:id, isNear: this.state.isNear })
      };
      fetch(url, requestOptions)
        .then(response => response.json())
        .then((text) => {
          this.setState({mappedCities: text.result.features})
        }).catch(function(error) {
        console.log('request failed', error)
      })
    })
  }
  handleClick = (event) => {
    const {isNear} =  this.state;
    const cityId = event.target.closest('li').dataset.cityId
    let url = `https://childlike-wool-venom.glitch.me/city/${cityId}`

    fetch(url)
      .then(response => response.json())
      .then((text) => {
        this.setState({city: text.result.data,
          viewport: {
            ...this.state.viewport,
            latitude: text.result.data.location.lat,
            longitude: text.result.data.location.lon,
          },
        }, () =>{
          url = `https://childlike-wool-venom.glitch.me/cities`
          const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityId, isNear })
          };
          fetch(url, requestOptions)
            .then(response => response.json())
            .then((text) => {
              console.log(text)
              this.setState({mappedCities: text.result.features,visible: false, name: this.state.city.name})
            }).catch(function(error) {
            console.log('request failed', error)
          })
        })
      }).catch(function(error) {
      console.log('request failed', error)
    })
  }
  handleChange = (evt) => {
    this.setState({[evt.target.name]: evt.target.value}, () => {
      const params = {
        name: this.state.name,
      }
      let query = Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&')
      let url = 'https://childlike-wool-venom.glitch.me/search?' + query
      this.setState({loading: true}, () =>{
        fetch(url)
          .then(data => data.json())
          .then((text) => {
            this.setState({suggestions: text.result.data,loading: false, visible: true})
          }).catch(function(error) {
          console.log('request failed', error)
        })
      })

    })
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.debouncedWindowResizeHandler)
  }
  updateViewport = viewport => this.setState({viewport: {...viewport}})

  render() {
    const {suggestions, city, viewport, mappedCities, loading, visible, name, isNear} = this.state
    return (
      <div className="max-h-screen max-w-screen">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mx-3  my-3">
          <div className="px-1 py-1">
            <div className="flex flex-no-wrap md:flex-wrap mx-2 my-2 ">
                <div className="relative">
                <Input type="search" name="name" onChange={this.handleChange}
                       value={name}
                       className="bg-purple-white"
                       placeholder="Search by city name..."/>
                <div className="absolute top-4 z-10">
                  <SuggestContainer>
                    <Ul style={{maxHeight: 300, overflowY: 'scroll'}}>
                      {name && loading && <Li>Loading...</Li>}
                      {
                        name&& suggestions && !loading && visible && suggestions.map(suggestion => <Li data-city-id={suggestion.id}
                                                                                                onClick={this.handleClick}>{suggestion.name}</Li>)
                      }
                    </Ul>
                  </SuggestContainer>
                </div>
                </div>
              <div className="flex items-center">
                <div
                  className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in ml-4">
                  <label className="inline-flex items-center mt-3">
                    <input type="checkbox" className="form-checkbox h-5 w-5" onChange={this.handleToggle}/><
                      span  className={cx("ml-2 ", {"line-through text-gray-500": isNear})}>Farthest</span>
                  </label>
                </div>

              </div>
              </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50">
                <ReactMapGL style={{textAlign: 'left'}}
                            mapboxApiAccessToken={
                              'pk.eyJ1IjoiYW5zaHVzYXVyYXYiLCJhIjoiY2tsdmh3MDRjMmdrcTJ3cW1ha2tvaWE1aCJ9.72IafeBeDVR56UN6NT8CjQ'
                            }
                            {...viewport}
                            onViewportChange={this.updateViewport}>
                  <NavigationControl
                    onViewportChange={this.updateViewport}
                    showCompass={true}
                  />
                  {city && (
                    <Marker
                      longitude={city.location.lon}
                      latitude={city.location.lat}
                      offsetLeft={-12}
                      offsetTop={-8}
                    >
                      <CityPin
                        size={20}
                      />
                    </Marker>
                  )
                  }
                  {
                    mappedCities && (

                        mappedCities.map(mCity =>(
                          <Marker

                            latitude={mCity.geometry.coordinates[0]}
                            longitude={mCity.geometry.coordinates[1]}
                            offsetLeft={-20}
                            offsetTop={-10}
                          >
                            <CityPin
                              size={20}
                              pinType={isNear?"near":"far"}
                            />
                          </Marker>
                        ))

                    )
                  }
                </ReactMapGL>
              </div>
            </dl>
          </div>
        </div>
      </div>

    )
  }
}


export default Home
