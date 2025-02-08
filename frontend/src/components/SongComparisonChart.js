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

const colors = [
    { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.2)' },
    { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.2)' },
    { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.2)' },
    { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.2)' },
    { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.2)' }
];

const SongComparisonChart = ({ inputSong, comparedSongs }) => {
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
                backgroundColor: colors[0].background,
                borderColor: colors[0].border,
                borderWidth: 2,
                pointBackgroundColor: colors[0].border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colors[0].border
            },
            ...comparedSongs.map((song, index) => ({
                label: song.name,
                data: features.map(feature => song[feature]),
                backgroundColor: colors[(index + 1) % colors.length].background,
                borderColor: colors[(index + 1) % colors.length].border,
                borderWidth: 2,
                pointBackgroundColor: colors[(index + 1) % colors.length].border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colors[(index + 1) % colors.length].border
            }))
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
                    color: 'white',
                    boxWidth: 20,
                    padding: 10,
                    textOverflow: 'ellipsis',
                    maxWidth: 150,
                    font: {
                        size: 12
                    },
                    generateLabels: (chart) => {
                        const datasets = chart.data.datasets;
                        return datasets.map((dataset, i) => {
                            const text = dataset.label || '';
                            // Tronquer le texte s'il dépasse 25 caractères
                            const truncatedText = text.length > 25 ? text.substring(0, 22) + '...' : text;
                            return {
                                text: truncatedText,
                                fillStyle: dataset.backgroundColor,
                                hidden: !chart.isDatasetVisible(i),
                                lineCap: dataset.borderCapStyle,
                                lineDash: dataset.borderDash,
                                lineDashOffset: dataset.borderDashOffset,
                                lineJoin: dataset.borderJoinStyle,
                                lineWidth: dataset.borderWidth,
                                strokeStyle: dataset.borderColor,
                                pointStyle: dataset.pointStyle,
                                datasetIndex: i
                            };
                        });
                    }
                },
                position: 'right',
                maxWidth: 150,
                maxHeight: 400
            }
        },
        maintainAspectRatio: false,
        layout: {
            padding: {
                right: 150 // Espace fixe pour la légende
            }
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
            <Radar data={data} options={options} />
        </div>
    );
};

export default SongComparisonChart; 