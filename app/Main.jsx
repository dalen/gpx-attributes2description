import React from 'react';
import { Well, Button, ProgressBar } from 'react-bootstrap';
import { remote } from 'electron';
import * as fs from 'fs';
import FileDrop from 'react-file-drop';
import { parseString, Builder } from 'xml2js';

export default class Main extends React.Component {
  state = {}

  openFileDialog = () => {
    this.openFiles(remote.dialog.showOpenDialog({ properties: ['openFile'] }));
  }

  dropFiles = (fileList) => {
    const files = [];
    for (let i = 0; i < fileList.length; i += 1) {
      files.push(fileList.item(i).path);
    }
    this.openFiles(files);
  }

  openFiles(files) {
    files.forEach((fileName) => {
      fs.readFile(fileName, (err, contents) => {
        if (err) throw err;
        this.processXML(fileName, contents);
      });
      this.setState({ [fileName]: 'in progress' });
    });
  }

  processXML(fileName, xml) {
    parseString(xml, (err, result) => {
      if (err) throw err;
      result.gpx.wpt.forEach((wpt) => {
        wpt['groundspeak:cache'].forEach((cache) => {
          if (cache['groundspeak:attributes'] &&
              cache['groundspeak:attributes'][0] &&
              cache['groundspeak:attributes'][0]['groundspeak:attribute']) {
            const attrs = cache['groundspeak:attributes'][0]['groundspeak:attribute'].map(attribute => attribute._);
            const shortDesc = wpt['groundspeak:cache'][0]['groundspeak:short_description'][0];
            if (shortDesc._) {
              shortDesc._ = `${attrs.join(', ')}. ${shortDesc._}`;
            } else {
              shortDesc._ = attrs.join(', ');
            }
          }
        });
      });
      this.saveXML(fileName, result);
    });
  }

  saveXML(fileName, xmlObject) {
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      allowSurrogateChars: true,
    });
    const xmlString = builder.buildObject(xmlObject);
    const extensionIndex = fileName.lastIndexOf('.');
    const newFileName = `${fileName.slice(0, extensionIndex)} att${fileName.slice(extensionIndex)}`;
    fs.writeFile(newFileName, xmlString, (err) => {
      if (err) throw err;
      this.setState({ [fileName]: 'finished' });
    });
  }

  render() {
    return (
      <FileDrop targetAlwaysVisible frame={window} onDrop={this.dropFiles}>
        <Well>
          <p>Click open or drag files here</p>
          <p><Button bsStyle="primary" onClick={this.openFileDialog}>Open</Button></p>
        </Well>
        {
          Object.getOwnPropertyNames(this.state).map((fileName) => {
            const fileState = this.state[fileName];
            if (fileState === 'in progress') {
              return (<ProgressBar label={fileName} active now={100} key={fileName} />);
            }
            return (<ProgressBar label={fileName} bsStyle="success" now={100} key={fileName} />);
          })
        }
      </FileDrop>
    );
  }
}
