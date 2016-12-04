import React from 'react';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Slider from './Views/Slider';
import IconButton from 'material-ui/IconButton';
import PlayIcon from 'material-ui/svg-icons/av/play-circle-filled';
import PauseIcon from 'material-ui/svg-icons/av/pause-circle-filled';
import StopIcon from 'material-ui/svg-icons/av/stop';
import ForwardIcon from 'material-ui/svg-icons/av/fast-forward';
import RewindIcon from 'material-ui/svg-icons/av/fast-rewind';
import ZeroIcon from 'material-ui/svg-icons/image/exposure-zero';

// const sound1 = require('../sound/beat1.mp3');
// const sound2 = require('../sound/acapella1.mp3');
const FileInput = require('react-file-input');

injectTapEventPlugin();
var ac = new (window.AudioContext || window.webkitAudioContext)();
ac.crossOrigin = "anonymous";
var gainNode = ac.createGain();

var leftInputName = 'input1';
var rightInputName = 'input2';

class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            globalVolume: 1,
            fade: 0.5,
            [`${leftInputName}Volume`]: 1,
            [`${rightInputName}Volume`]: 1,
            [`${leftInputName}Url`]: null,
            [`${rightInputName}Url`]: null,
            [`${leftInputName}Rate`]: 1,
            [`${rightInputName}Rate`]: 1,
            [`${leftInputName}Urls`]: [/*sound1*/],
            [`${rightInputName}Urls`]: [/*sound2*/],
        };
    }

    static defaultProps = {
        inputs: [
            {
                id: leftInputName,
                // defaultSource: sound1
            },
            {
                id: rightInputName,
                // defaultSource: sound2
            }
        ]
    };

    initAudio = (id) => {
        let input = document.querySelector(`#${id}`);

        this[id] = ac.createMediaElementSource(input);


        this[id].connect(gainNode);
        gainNode.connect(ac.destination);
    };

    componentDidMount() {
        this.props.inputs.map(input => this.initAudio(input.id));
    }

    handleVolumeChange = (value, id) => {
        let inputToChange = document.querySelector(`#${id}`);

        this.setState({
            [`${id}Volume`]: value
        }, () => {
            gainNode.gain.value = value;
            inputToChange.volume = value;
            this.handleGlobalVolumeChange();
            this.handleFade();
        })
    };

    handleRateChange = (value, id) => {
        this.setState({
            [`${id}Rate`]: value
        }, () => {
            this[id].mediaElement.playbackRate = value;
        })
    };

    handleGlobalVolumeChange = (value = this.state.globalVolume) => {
        let audioElements = document.querySelectorAll('audio');

        this.setState({
            globalVolume: value
        }, () => {
            audioElements.forEach(a => {
                let inputValue = this.state[`${a.id}Volume`] || 1;
                this[a.id].mediaElement.volume = inputValue * value;
                a.volume = inputValue * value;
            });
        });
    };

    handleFade = (value = this.state.fade) => {
        this.setState({
            fade: value
        }, () => {
            if (value < .5) {
                let id = this.props.inputs[0].id;
                let input = document.querySelector(`#${id}`);
                let difference = value * 2;
                input.volume = (this.state[`${id}Volume`] || 1) * difference;
                this[id].mediaElement.volume = (this.state[`${id}Volume`] || 1) * difference;
            } else {
                let id = this.props.inputs[1].id;
                let input = document.querySelector(`#${id}`);
                let difference = 1 - (value - .5) * 2;
                input.volume = (this.state[`${id}Volume`] || 1) * difference;
                this[id].mediaElement.volume = (this.state[`${id}Volume`] || 1) * difference;
            }
        });
    };

    handleFileUpload = (e, id) => {
        let stateId = `${id}Urls`;
        let isPlayingStateId = `${id}IsPlaying`;
        let url = this.createAudioBlob(e.target.files[0], id);
        this.setState({
            [stateId]: [...this.state[stateId], url],
            [isPlayingStateId]: false
        });
        // this.handleGlobalPlay(true);
        this[id].mediaElement.src = url;
    };


    handleTrackPlay = (id, stop) => {
        let isPlaying = this.state[`${id}IsPlaying`];
        let method = isPlaying ? 'pause' : 'play';
        let element = this[id].mediaElement;


        Promise.all([element[method]()]).then(() => {
            if (stop) {
                element.currentTime = 0;
                this.setState({
                    [`${id}PlayingProgress`]: 0
                })
            }

            this.setState({
                [`${id}IsPlaying`]: !isPlaying
            });

            if (!isPlaying) {
                this.setState({
                    [`${id}PlayingProgress`]: element.currentTime / element.duration * 100
                });
                this[`${id}Interval`] = setInterval(() => {
                    let percents = element.currentTime / element.duration * 100;
                    this.setState({
                        [`${id}PlayingProgress`]: element.currentTime / element.duration * 100
                    });
                    if (percents >= 100) {
                        this.handleTrackPlay(id, true);
                        clearInterval(this[`${id}Interval`]);
                    }

                }, 1000);
            } else {
                clearInterval(this[`${id}Interval`]);
            }

        })
    };

    handleTrackChange = (direction, id) => {
        let urlsStateId = `${id}Urls`;
        let isPlayingStateId = `${id}IsPlaying`;
        let urlStateId = `${id}Url`;
        let currentUrl = this.state[urlStateId];
        let currentIndex = this.state[urlsStateId].indexOf(currentUrl);
        if (direction == 'forward') {
            if (currentIndex == this.state[urlsStateId].length - 1) return;
            let url = this.state[urlsStateId][currentIndex + 1];
            this.setState({
                [urlStateId]: url,
                [isPlayingStateId]: false
            }, () => {
                this[id].mediaElement.src = url;
                this.handleTrackPlay(id);
            });

        } else {
            if (currentIndex == 0) return;
            let url = this.state[urlsStateId][currentIndex - 1];
            this.setState({
                [urlStateId]: url,
                [isPlayingStateId]: false
            }, () => {
                this[id].mediaElement.src = url;
                this.handleTrackPlay(id);
            });

        }
    };

    handleStartOver = (id) => {
        this[id].mediaElement.currentTime = 0;
    };

    handleTrackProgressClick = (value, id) => {
        let element = this[id].mediaElement;
        element.currentTime = element.duration / 100 * value;
    };

    renderMediaController = (id, src) => {
        return (
            <div>
                <div className="mx__controller" style={{display: this.state[`${id}Urls`].length ? 'block' : 'none'}}>
                    <div className="mx__player">
                        <h4>Управління треком (нужно загрузить еще файл, чтобы кнопки смены трека стали активны)</h4>
                        <IconButton disabled={this.state[`${id}Urls`].length <= 1}
                                    onClick={() => this.handleTrackChange('rewind', id)}>
                            <RewindIcon />
                        </IconButton>
                        <IconButton onClick={e => this.handleTrackPlay(id)}>
                            {this.state[`${id}IsPlaying`] ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                        <IconButton onClick={() => this.handleTrackPlay(id, true)}>
                            <StopIcon />
                        </IconButton>
                        <IconButton tooltip="Начать сначала" tooltipPosition="top-center"
                                    onClick={() => this.handleStartOver(id)}>
                            <ZeroIcon />
                        </IconButton>
                        <IconButton disabled={this.state[`${id}Urls`].length <= 1}
                                    onClick={() => this.handleTrackChange('forward', id)}>
                            <ForwardIcon />
                        </IconButton>
                        <Slider
                            min={0}
                            max={100}
                            defaultValue={0}
                            value={this.state[`${id}PlayingProgress`]}
                            onChange={(e, value) => this.handleTrackProgressClick(value, id)}
                        />
                        <audio id={id} controls key={src}>
                            <source src={src} type="audio/mp3"/>
                        </audio>
                    </div>
                    <div className="mx__volume-handler">
                        <Slider
                            title={`Регулювання гучності для кожного треку (${(this.state[id + 'Volume'] * 100).toFixed()}%)`}
                            onChange={(e, value) => this.handleVolumeChange(value, id)}
                        />
                    </div>
                    <div className="mx__rate-handler">
                        <Slider
                            title={`Управління темпом треку (${this.state[id + 'Rate']})`}
                            min={0.5}
                            max={1.5}
                            onChange={(e, value) => this.handleRateChange(value, id)}
                        />
                    </div>
                </div>
                <div className="mx__uploader">
                    <h4>Загрузка треку</h4>
                    <FileInput
                        name={`${id}Upload`}
                        accept=".mp3"
                        placeholder={`Upload track for ${id}`}
                        className="mx__upload"
                        onChange={e => this.handleFileUpload(e, id)}
                    />
                </div>
            </div>
        )
    };

    handleGlobalPlay = (stop) => {
        let isPlaying = this.state.globalIsPlaying;
        this.props.inputs.forEach(input => this.handleTrackPlay(input.id, stop));
        this.setState({
            globalIsPlaying: !isPlaying
        });
    };

    renderGlobalControls = () => {
        let {globalIsPlaying} = this.state;
        return (
            <div className="mx__global"
                 style={{display: this.state[`${leftInputName}Urls`].length && this.state[`${rightInputName}Urls`].length ? 'block' : 'none'}}>
                <div className="mx__volume-handler">
                    <Slider
                        title={'Центральний контроллер гучності'}
                        onChange={(e, value) => this.handleGlobalVolumeChange(value)}
                    />
                </div>
                <div className="mx__fader">
                    <Slider
                        title={'Центральний фейдер'}
                        defaultValue={0.5}
                        onChange={(e, value) => this.handleFade(value)}
                    />
                </div>
                <div className="mx__play-controller">
                    <h4>Управління двома треками одразу</h4>
                    <IconButton onClick={e => this.handleGlobalPlay()}>
                        {globalIsPlaying ? <PauseIcon /> : <PlayIcon />}
                    </IconButton>
                    <IconButton onClick={() => this.handleGlobalPlay(true)}>
                        <StopIcon />
                    </IconButton>
                </div>
            </div>
        )
    };

    createAudioBlob = (file, id) => {
        let reader = new FileReader();

        reader.onload = (event) => {
            let arrayBuffer = event.target.result;
        };


        reader.readAsArrayBuffer(file);
        let url = URL.createObjectURL(file);

        this.setState({
            [`${id}Url`]: url
        });

        return url;
    };

    render() {
        return (
            <MuiThemeProvider>
                <div>
                    <h2>Dev Challenge 10</h2>
                    {this.props.inputs.map(input => {
                        return (
                            <div key={input.id} className="grid-half">
                                {this.renderMediaController(input.id, this.state[`${input.id}Url`] || input.defaultSource)}
                            </div>
                        )
                    })}
                    {this.renderGlobalControls()}
                </div>
            </MuiThemeProvider>
        )
    }
}

export default App;
