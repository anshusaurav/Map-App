import axios from 'axios';

const url = axios.create({
  baseURL: 'https://childlike-wool-venom.glitch.me/',
});

export const getApiSuggestions = (word) => {
  let result = url
    .get(`/search?name=${word}`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      return error;
    });

  return result;
};
