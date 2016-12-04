import React from 'react';
const {PropTypes} = React;
import Slider from 'material-ui/Slider';

export default (props) => {
    return (
        <div className="slider">
            {props.title && <h4>{props.title}</h4>}
            <Slider
                defaultValue={props.defaultValue || (props.defaultValue === 0 ? 0 : 1)}
                onChange={props.onChange}
                min={props.min}
                max={props.max}
                value={props.value}
            />
        </div>
    )
};