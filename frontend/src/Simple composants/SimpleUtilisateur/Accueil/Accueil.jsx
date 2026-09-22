import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "./Accueil.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";
import Service from "./Service";
import Sexe from "./Sexe";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StagiaireEtablissementChart = () => {
  const [chartData, setChartData] = useState(null);
  const [compteurStagiaire, setCompteurStagiaire] = useState(0);
  const [compteurDemande, setCompteurDemande] = useState(0);
  const [totalStagiaire, setTotalStagiaire] = useState(0);
  const [ancien, setAncien] = useState(0);
  const [routeAxios, setRouteAxios] = useState({
    service: "http://localhost:8080/tableau/etablissement",
    filiere: "http://localhost:8080/tableau/filiere",
    sexe: "http://localhost:8080/tableau/sexe",
  });

  const [backDemande, setBackDemande] = useState("#f4f7f7");
  const [backStagiaire, setBackStagiaire] = useState(" #f4f7f7");
  const [borderAc, setBorderAc] = useState("7px solid #3a5134");
  const [backAncien, setbackAncien] = useState("");

  const [cursorStyle, setCursorStyle] = useState("default"); // Par défaut, le curseur est 'default'

  // Fonction qui change le curseur au survol
  const handleMouseOver = () => {
    setCursorStyle("pointer"); // Change le curseur à 'pointer' (main)
  };

  const handleMouseOut = () => {
    setCursorStyle("default"); // Restaure le curseur par défaut
  };

  const compterStagiaire = () => {
    axios
      .get("http://localhost:8080/tableau/stageActuel")
      .then((response) => {
        console.log(response);
        setCompteurStagiaire(response.data[0].totalstagiairesactuels);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const compterDemande = () => {
    axios
      .get("http://localhost:8080/tableau/DemandeEncours")
      .then((response) => {
        console.log(response);
        setCompteurDemande(response.data[0].totaldemandesansdecision);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const compterLesStagiaire = () => {
    axios
      .get("http://localhost:8080/tableau/stagiaireTotal")
      .then((response) => {
        console.log(response);
        setTotalStagiaire(response.data[0].totalstagiaire);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const compterAncien = () => {
    axios
      .get("http://localhost:8080/tableau/stagiaireAncien")
      .then((response) => {
        console.log(response);
        setAncien(response.data[0].ancienstagiaire);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(routeAxios.filiere); // Remplacez par l'URL complète de votre API si nécessaire
      const dataFromDB = response.data;

      // Extraction des labels et des valeurs
      const labels = dataFromDB.map((item) => item.filiere);
      const counts = dataFromDB.map((item) => item.total);

      // Configuration des données pour le graphique
      const formattedData = {
        labels: labels,
        datasets: [
          {
            label: "Nombre de Stagiaires par filière",
            data: counts,
            borderColor: "#247AFD", // Couleur de la ligne
            backgroundColor: "#247AFD", // Couleur de fond sous la ligne
            borderWidth: 2,
            pointBackgroundColor: "#247AFD", // Couleur des points
            pointBorderColor: "#fff",
            tension: 0.4, // Adoucit la ligne
          },
        ],
      };

      setChartData(formattedData);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    }
  };

  useEffect(() => {
    compterStagiaire();
    compterDemande();
    compterLesStagiaire();
    compterAncien();
    fetchData();
  }, [routeAxios]);

  const options = {
    responsive: true,
    devicePixelRatio: 2,

    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Répartition des Stagiaires par Filière",
        font: {
          size: 15, // Taille de la police du titre
        },
        color: "#08182b", // Couleur du titre
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Filière",
        },
      },
      y: {
        title: {
          display: true,
          text: "Stagiaires",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="Accueil">
      <div className="Compteur">
        <button
          type="button"
          className="bouttonDiv"
          style={{ backgroundColor: backStagiaire }}
          onClick={() => {
            setRouteAxios({
              service: "http://localhost:8080/tableau/etablissement/stagiaire",
              filiere: "http://localhost:8080/tableau/filiere/stagiaire",
              sexe: "http://localhost:8080/tableau/sexe/stagiaire",
            });
            setBorderAc("none");
            setBackDemande("#f4f7f7");
            setBackStagiaire("#C65102");
            setbackAncien("#f4f7f7");
          }}
        >
          <div
            className="divCompteur"
            id="stagiaireDiv"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            style={{ cursor: cursorStyle }}
          >
            <div className="iconNombre">
              <div className="iconCompteur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  fill="currentColor"
                  className="bi bi-person-square"
                  viewBox="0 0 16 16"
                >
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                  <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1v-1c0-1-1-4-6-4s-6 3-6 4v1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
                </svg>
              </div>
              <div className="compteurNombre">{compteurStagiaire}</div>
            </div>
            <div className="titreCompteur">Stagiaires actuels</div>
          </div>
        </button>

        <button
          type="button"
          className="bouttonDiv"
          onClick={() => {
            setRouteAxios({
              service: "http://localhost:8080/tableau/etablissement/demande",
              filiere: "http://localhost:8080/tableau/filiere/demande",
              sexe: "http://localhost:8080/tableau/sexe/demande",
            });
            setBorderAc("none");
            setBackDemande("#005f6b");
            setBackStagiaire("#f4f7f7");
            setbackAncien("#f4f7f7");
          }}
          style={{ backgroundColor: backDemande }}
        >
          <div
            className="divCompteur"
            id="DemandeDiv"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            style={{ cursor: cursorStyle }}
          >
            <div className="iconNombre">
              <div className="iconCompteur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  fill="currentColor"
                  className="bi bi-envelope-exclamation-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414zM0 4.697v7.104l5.803-3.558zM6.761 8.83l-6.57 4.026A2 2 0 0 0 2 14h6.256A4.5 4.5 0 0 1 8 12.5a4.49 4.49 0 0 1 1.606-3.446l-.367-.225L8 9.586zM16 4.697v4.974A4.5 4.5 0 0 0 12.5 8a4.5 4.5 0 0 0-1.965.45l-.338-.207z" />
                  <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1.5a.5.5 0 0 1-1 0V11a.5.5 0 0 1 1 0m0 3a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0" />
                </svg>
              </div>
              <div className="compteurNombre">{compteurDemande}</div>
            </div>
            <div className="titreCompteur">Demande en cours </div>
          </div>
        </button>

        <button
          type="button"
          className="bouttonDiv"
          style={{ backgroundColor: backAncien }}
          onClick={() => {
            setRouteAxios({
              service:
                "http://localhost:8080/tableau/etablissement/ancienStagiaire",
              filiere: "http://localhost:8080/tableau/filiere/ancienStagiaire",
              sexe: "http://localhost:8080/tableau/sexe/ancienStagiaire",
            });
            setBorderAc("none");
            setBackDemande("#f4f7f7");
            setBackStagiaire("#f4f7f7");
            setbackAncien("#6C3461");
          }}
        >
          <div
            className="divCompteur"
            id="ancienDiv"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            style={{ cursor: cursorStyle }}
          >
            <div className="iconNombre">
              <div className="iconCompteur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  fill="#6C3461"
                  className="bi bi-person-square"
                  viewBox="0 0 16 16"
                >
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                  <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1v-1c0-1-1-4-6-4s-6 3-6 4v1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
                </svg>
              </div>
              <div className="compteurNombre">{ancien}</div>
            </div>
            <div className="titreCompteur" style={{ color: "#6C3461" }}>
              Anciens stagiaires
            </div>
          </div>
        </button>

        <button
          type="button"
          style={{ border: borderAc }}
          id="actualiser"
          onClick={() => {
            setRouteAxios({
              service: "http://localhost:8080/tableau/etablissement",
              filiere: "http://localhost:8080/tableau/filiere",
              sexe: "http://localhost:8080/tableau/sexe",
            });
            setBorderAc("7px solid #3a5134");
            setBackDemande("#f4f7f7");
            setBackStagiaire("#f4f7f7");
            setbackAncien("#f4f7f7");
          }}
        >
          <div className="divCompteur">
            <div className="iconNombre">
              <div className="iconCompteur">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  fill="#3a5134"
                  className="bi bi-person-square"
                  viewBox="0 0 16 16"
                >
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                  <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1v-1c0-1-1-4-6-4s-6 3-6 4v1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
                </svg>
              </div>
              <div className="compteurNombre">{totalStagiaire}</div>
            </div>
            <div className="titreCompteur" style={{ color: "#3a5134" }}>
              Total stagiaires
            </div>
          </div>
        </button>
      </div>

      <div className="diagramme">
        <div className="diagrammeAccueil">
          <Service route={routeAxios.service} />
        </div>

        <div className="diagrammeAccueil">
          <Sexe route={routeAxios.sexe} />
        </div>

        <div
          style={{ width: "360px", margin: "0 auto" }}
          className="diagrammeAccueil"
        >
          {chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <p>Chargement des données...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StagiaireEtablissementChart;
