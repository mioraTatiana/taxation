import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Service = ({route}) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(route); // Remplacez par l'URL complète si nécessaire
        const dataFromDB = response.data;

        // Extraire les labels et les valeurs de chaque filière

        const labels = dataFromDB.map((item) => item.nomservice); // Noms des établissements
        const counts = dataFromDB.map((item) => item.total); // Nombre de stagiaires par établissement
  

        // Couleurs spécifiques pour chaque filière
        const colors = {
          Topographie: '#f8ca00',
        };

        // Format des données pour le graphique
        const formattedData = {
          labels: labels,
          datasets: [
            {
              label: 'Nombre de Stagiaires',
              data: counts,
              backgroundColor: labels.map(label => colors[label] || '#f8ca00'), // Appliquer la couleur en fonction de la filière
              borderColor: '#f8ca00',
              borderWidth: 1,
            },
          ],
        };

        setChartData(formattedData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
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
        text: 'Statistiques des Stagiaires par service',
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
    <div style={{ width: '360px', margin: '0 auto' }}>
      {chartData ? (
        <Bar data={chartData} options={options} />
      ) : (
        <p>Chargement des données...</p>
      )}
    </div>
  );
};

export default Service;
