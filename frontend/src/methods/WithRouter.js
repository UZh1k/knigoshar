import { useNavigate, useLocation, useParams } from 'react-router-dom';
import React, {Component} from 'react'
import {useGeolocated} from "react-geolocated";

export const withRouter = (Component) => {
    const Wrapper = (props) => {
        const navigator = useNavigate();
        const location = useLocation();
        const params = useParams();
        return (
            <Component
                params={params}
                navigator={navigator}
                location={location}
                {...props}
            />
        );
    };
    return Wrapper;
};

export const withGeolocator = (Component) => {
    const Wrapper = (props) => {
        const geolocator = useGeolocated({
			positionOptions: {
				enableHighAccuracy: false,
			},
			userDecisionTimeout: 10000,
		});
        return (
            <Component
                geolocator={geolocator}
                {...props}
            />
        );
    };
    return Wrapper;
};