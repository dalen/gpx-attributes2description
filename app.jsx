import React from 'react';
import ReactDOM from 'react-dom';
import Main from './app/Main.jsx';

window.onload = () => {
  ReactDOM.render(<Main />, document.getElementById('app'));
};
