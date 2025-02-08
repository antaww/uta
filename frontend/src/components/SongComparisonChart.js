import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const SongComparisonChart = ({ inputSong, comparedSong }) => {
    const features = [
        'valence',
        'energy',
        'danceability',
        'acousticness',
        'instrumentalness',
        'liveness'
    ];

    const data = {
        labels: features.map(f => f.charAt(0).toUpperCase() + f.slice(1)),
        datasets: [
            {
                label: 'Input Song',
                data: features.map(feature => inputSong[feature]),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(54, 162, 235)'
            },
            {
                label: 'Recommended Song',
                data: features.map(feature => comparedSong[feature]),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                pointBackgroundColor: 'rgb(255, 99, 132)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(255, 99, 132)'
            }
        ]
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.2)'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.2)'
                },
                pointLabels: {
                    color: 'white'
                },
                ticks: {
                    color: 'white',
                    backdropColor: 'transparent'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: 'white'
                }
            }
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <Radar data={data} options={options} />
        </div>
    );
};

export default SongComparisonChart; 