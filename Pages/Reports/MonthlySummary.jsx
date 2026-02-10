import React, { useState, useEffect } from "react";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import propTypes from "prop-types";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js";
import "./MonthlySummary.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Drive from "../../Assets/image 24.png";
import Distance from "../../Assets/image 26.png";
import Carbon from "../../Assets/image 27.png";

ChartJS.register(
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement
);

// We will pass the vehicles data from the parent component
function MonthlySummary({ vehicles }) {
  const [vehicleType, setVehicleType] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [month, setMonth] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [fetchedData, setFetchedData] = useState(null);
  const [temperatureData, setTemperatureData] = useState(null);

  useEffect(() => {
    // Filter vehicles whenever the vehicleType prop changes
    if (vehicleType) {
      const filtered = vehicles.filter((v) => v.device_type_name === vehicleType);
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
    setVehicle(""); // Reset selected vehicle when type changes
  }, [vehicleType, vehicles]);

  const handleMonthChange = (e) => setMonth(e.target.value);

  const backendUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = () => {
    if (vehicleType && vehicle && month) {
      // Assuming 'month' is in the format "YYYY-MM"
      const formattedDate = month;
      const formattedDateWithSlashes = formattedDate.replace(/-/g, "/");

      const chargingApiUrl = `${backendUrl}/reports/monthly_charging_report/?&vehicle=${vehicle}&month=${formattedDateWithSlashes}`;
      const temperatureApiUrl = `${backendUrl}/reports/monthly_temperature_report/?&vehicle=${vehicle}&month=${formattedDateWithSlashes}`;

      console.log("Fetching data from:", chargingApiUrl, temperatureApiUrl);

      Promise.all([
        fetch(chargingApiUrl).then((response) => response.json()),
        fetch(temperatureApiUrl).then((response) => response.json()),
      ])
        .then(([chargingData, temperatureData]) => {
          console.log("Charging Data:", chargingData);
          console.log("Temperature Data:", temperatureData);
          const transformedTemperatureData = {
            dates: temperatureData.map((item) => item.Date),
            a_max: temperatureData.map((item) => item.max_A_MaxCellTemp),
            b_max: temperatureData.map((item) => item.max_B_MaxCellTemp),
          };

          setFetchedData(chargingData);
          setTemperatureData(transformedTemperatureData);
        })
        .catch((error) => console.error("Error fetching data:", error));
    } else {
      alert("Please Select All Fields");
    }
  };

  const lineChartData = temperatureData
    ? {
        labels: temperatureData.dates,
        datasets: [
          {
            label: "A max",
            data: temperatureData.a_max,
            borderColor: "#FF6384",
            width: "100%",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            fill: false,
          },
          {
            label: "B max",
            data: temperatureData.b_max,
            borderColor: "#36A2EB",
            width: "100%",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            fill: false,
          },
        ],
      }
    : null;

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Dates",
        },
      },
      y: {
        title: {
          display: true,
          text: "Temperature",
        },
        min: 33,
      },
    },
  };

  const sortedData =
    fetchedData
      ?.slice()
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date)) || [];
  const formatDuration = (duration) => {
    if (typeof duration !== "string") {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const durationWithoutHours = duration.replace(" hours", "").trim();

    const timeParts = durationWithoutHours.split(":");
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    const seconds = parseInt(timeParts[2] || "0") || 0;

    return { hours, minutes, seconds };
  };

  const groupedData = sortedData.reduce((acc, item) => {
    const date = item.start_date;
    if (!acc[date]) {
      acc[date] = {
        fast: { totalDuration: 0, count: 0 },
        slow: { totalDuration: 0, count: 0 },
      };
    }
    const { hours, minutes, seconds } = formatDuration(item.Charge_Duration);
    const totalDurationInHours = hours + minutes / 60 + seconds / 3600;
    if (item.Charge_Type === "Fast") {
      acc[date].fast.totalDuration += totalDurationInHours;
      acc[date].fast.count += 1;
    } else if (item.Charge_Type === "Slow") {
      acc[date].slow.totalDuration += totalDurationInHours;
      acc[date].slow.count += 1;
    }
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(groupedData),
    datasets: [
      {
        label: "Fast Charging",
        data: Object.values(groupedData).map((data) => {
          return parseFloat(data.fast.totalDuration.toFixed(1));
        }),
        backgroundColor: "#4CAF50",
      },
      {
        label: "Slow Charging",
        data: Object.values(groupedData).map((data) => {
          return parseFloat(data.slow.totalDuration.toFixed(1));
        }),
        backgroundColor: "#FF5722",
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const startDate = context.chart.data.labels[index];
            const fastData = groupedData[startDate].fast;
            const slowData = groupedData[startDate].slow;
            const duration =
              context.dataset.label === "Fast Charging"
                ? fastData.totalDuration
                : slowData.totalDuration;
            const count =
              context.dataset.label === "Fast Charging"
                ? fastData.count
                : slowData.count;
            return `${
              context.dataset.label
            }: ${count} cycles, Total duration: ${duration.toFixed(2)} mins`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Time Duration (hours)",
        },
      },
    },
  };

  return (
    <div className="monthly-report">
      <div className="Monthly-reportsform">
        <span>
          <select
            className="vehicle-2"
            value={vehicleType}
            onChange={(e) => {
              setVehicleType(e.target.value);
            }}
          >
            <option value="" defaultValue>
              Vehicle Type
            </option>
            {/* Dynamically populate vehicle types */}
            {[...new Set(vehicles.map((v) => v.device_type_name))].map(
              (type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              )
            )}
          </select>
        </span>
        <select
          className="Monthly-report-dropdown"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
        >
          <option value="" defaultValue>
            Registration Number
          </option>
          {filteredVehicles.map((v) => (
            <option key={v.device_id} value={v.device_id}>
              {v.VRN}
            </option>
          ))}
        </select>
        <div className="selection-item">
          <input
            type="month"
            className="monthly-report-date"
            value={month}
            onChange={handleMonthChange}
            required
          />
        </div>
        <button className="monthly-report-submit" onClick={handleSubmit}>
          Submit
        </button>
      </div>

      <div className="monthly-report-data-containers-wrapper">
        <div className="monthly-report-data-container">
          <p className="text">Driving Overview</p>
          <div className="monthly-report-data-box-1">
            <div className="monthly-report-stat-item">
              <p className="label">Drive Time</p>
              <img src={Drive} alt="" className="monthly-report-icon" />
              <p className="monthly-report-value">XXX</p>
            </div>
            <div className="monthly-report-stat-item">
              <p className="label">Total Distance</p>
              <img src={Distance} alt="" className="monthly-report-icon" />
              <p className="monthly-report-value">XXX</p>
            </div>
            <div className="monthly-report-stat-item">
              <p className="label">Idle Time</p>
              <i className="bi bi-clock-fill monthly-report-icon-3"></i>
              <p className="monthly-report-value">XXX</p>
            </div>
            <div className="monthly-report-stat-item">
              <p className="label">Average Speed</p>
              <i className="bi bi-speedometer monthly-report-icon-2"></i>
              <p className="monthly-report-value">XXX</p>
            </div>
            <div className="monthly-report-stat-item">
              <p className="label">Top Speed</p>
              <i className="bi bi-speedometer2 monthly-report-icon-2"></i>
              <p className="monthly-report-value">XXX</p>
            </div>
            <div className="monthly-report-stat-item">
              <p className="label">
                CO<sub>2</sub> Saving's
              </p>
              <img src={Carbon} alt="" className="monthly-report-icon" />
              <p className="monthly-report-value">XXX</p>
            </div>
          </div>
        </div>
        <div className="monthly-report-data-container">
          <p className="text">Energy Overview</p>
          <div className="monthly-report-data-box">
            <div className="monthly-report-data-box-val-1">
              <p
                style={{
                  color: "#0078d4",
                }}
              >
                Energy Consumption Efficiency: {75 /* Dummy Value */}%
              </p>
              <p
                style={{
                  color: "#34a853",
                  fontWeight: "bold",
                  marginBottom: "30px",
                }}
              >
                Regeneration Efficiency: {25 /* Dummy Value */}%
              </p>
            </div>
            <div id="monthly-report-data-box-chart">
              <Doughnut
                data={{
                  labels: [
                    "Energy Consumption Efficiency",
                    "Regeneration Efficiency",
                  ],
                  datasets: [
                    {
                      data: [
                        fetchedData?.energyConsumption || 75,
                        fetchedData?.regenerationEfficiency || 25,
                      ],
                      backgroundColor: ["#0078d4", "#34a853"],
                      hoverBackgroundColor: ["#005a9e", "#1e7c37"],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  cutout: "70%",
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="monthly-report-data-containers-wrapper">
        <div className="monthly-report-data-container">
          <p className="text-2">Battery Temperature Trends</p>
          <div className="monthly-report-data-box">
            {lineChartData && (
              <Line data={lineChartData} options={lineChartOptions} />
            )}
          </div>
        </div>
        <div className="monthly-report-data-container">
          <p className="text-2">Charging Trends</p>
          <div className="monthly-report-data-box">
            {fetchedData ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <p>No Data Please Submit</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
MonthlySummary.propTypes = {
  vehicles: propTypes.array.isRequired,
};

export default MonthlySummary;