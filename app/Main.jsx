/* eslint import/no-extraneous-dependencies: ["error", { "devDependencies": true }] */
import { remote } from 'electron';
import React from 'react';
import { Alert, Well, Button, ProgressBar } from 'react-bootstrap';
import * as fs from 'fs';
import * as path from 'path';
import FileDrop from 'react-file-drop';
import { parseString, Builder } from 'xml2js';

export default class Main extends React.Component {
  state = {};

  openFileDialog = () => {
    this.openFiles(
      remote.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'GPX Files', extensions: ['gpx'] }],
      }),
    );
  };

  dropFiles = fileList => {
    const files = [];
    for (let i = 0; i < fileList.length; i += 1) {
      files.push(fileList.item(i).path);
    }
    this.openFiles(files);
  };

  openFiles(files) {
    files.forEach(fileName => {
      fs.readFile(fileName, (err, contents) => {
        if (err) {
          this.setState({
            [fileName]: {
              state: 'error',
              message: `Failed to open file: ${err.message}`,
            },
          });
          throw err;
        }
        this.processXML(fileName, contents);
      });
      this.setState({ [fileName]: { state: 'in progress' } });
    });
  }

  processXML(fileName, xml) {
    parseString(xml, (err, result) => {
      if (err) {
        this.setState({
          [fileName]: {
            state: 'error',
            message: `Failed to parse file, is it a GPX file?: ${err.message}`,
          },
        });
        throw err;
      }
      try {
        console.log(result.gpx);
        result.gpx.wpt.forEach(wpt => {
          if (wpt['groundspeak:cache']) {
            wpt['groundspeak:cache'].forEach(cache => {
              if (
                cache['groundspeak:attributes'] &&
                cache['groundspeak:attributes'][0] &&
                cache['groundspeak:attributes'][0]['groundspeak:attribute']
              ) {
                const attrs = cache['groundspeak:attributes'][0][
                  'groundspeak:attribute'
                ].map(attribute => {
                  if (attribute.$.inc == '0') {
                    return `Not ${attribute._}`;
                  } else {
                    return attribute._;
                  }
                });
                const shortDesc =
                  wpt['groundspeak:cache'][0][
                    'groundspeak:short_description'
                  ][0];
                if (shortDesc._) {
                  shortDesc._ = `${attrs.join(', ')}. ${shortDesc._}`;
                } else {
                  shortDesc._ = attrs.join(', ');
                }
              }
            });
          }
        });
        this.saveXML(fileName, result);
      } catch (error) {
        this.setState({
          [fileName]: {
            state: 'error',
            message:
              'Failed to parse file, maybe it is the wpts file?: ' + error,
          },
        });
      }
    });
  }

  saveXML(fileName, xmlObject) {
    const builder = new Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      allowSurrogateChars: true,
    });
    const xmlString = builder.buildObject(xmlObject);
    const extensionIndex = fileName.lastIndexOf('.');
    const newFileName = `${fileName.slice(
      0,
      extensionIndex,
    )} att${fileName.slice(extensionIndex)}`;
    fs.writeFile(newFileName, xmlString, err => {
      if (err) {
        this.setState({
          [fileName]: {
            state: 'error',
            message: `Failed to save file: ${err.message}`,
          },
        });
        throw err;
      }
      this.setState({ [fileName]: { state: 'finished' } });
    });
  }

  render() {
    return (
      <FileDrop targetAlwaysVisible frame={window} onDrop={this.dropFiles}>
        <Well>
          <p>Click open or drag files here</p>
          <p>
            <Button bsStyle="primary" onClick={this.openFileDialog}>
              Open
            </Button>
          </p>
        </Well>
        {Object.getOwnPropertyNames(this.state)
          .reverse()
          .map(filePath => {
            const file = this.state[filePath];
            const fileName = path.basename(filePath);

            if (file.state === 'in progress') {
              return (
                <ProgressBar label={fileName} active now={100} key={fileName} />
              );
            } else if (file.state === 'error') {
              return (
                <Alert bsStyle="danger">
                  <strong>{fileName}</strong>:<br />
                  {file.message}
                </Alert>
              );
            }
            return (
              <ProgressBar
                label={fileName}
                bsStyle="success"
                now={100}
                key={fileName}
              />
            );
          })}
      </FileDrop>
    );
  }
}
