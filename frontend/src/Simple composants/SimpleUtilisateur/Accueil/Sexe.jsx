import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Sexe = ({route}) => {
  const [chartData, setChartData] = useState(null);


  useEffect(() => {
    axios.get(route)
      .then((response) => {
        const data = response.data[0]; // Extraction des données depuis la réponse
        // Préparation des données pour le graphique
        const formattedData = {
          labels: ['Feminin', 'Masculin'],
          datasets: [
            {
              label: 'Répartition par Sexe',
              data: [data.total_feminin, data.total_masculin],
              backgroundColor: ['#f8ca00', '#30A9DE'], // Couleurs pour chaque section
              borderColor: '#ffffff',
              borderWidth: 1,
            },
          ],
        };

        setChartData(formattedData);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des données : ", error);
      });
  }, [route]);

  const options = {
    responsive: true,
    devicePixelRatio: 2,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14, // Taille de la police des labels
            family: 'Arial', // Police des labels
            weight: 'bold', // Épaisseur de la police des labels
          },
          color: '#333', // Couleur des labels
        },
      },
      title: {
        display: true,
        text: 'Statistiques des Stagiaires par Sexe',
        font: {
          size: 15, // Taille de la police du titre
        },
        color: '#08182b', // Couleur du titre
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
  };
  
  return (
    <div style={{ width: '260px',  margin: '0 auto' }}>
      {chartData ? (
        <Pie data={chartData} options={options} />
      ) : (
        <p>Chargement des données...</p>
      )}

    </div>
  );
};

export default Sexe;
