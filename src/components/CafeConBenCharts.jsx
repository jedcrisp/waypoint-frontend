import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from "recharts";

const COLORS = ["#0074D9", "#FF4136"];

const CafeConBenCharts = ({ result }) => {
  const hceAvgBenefit = result?.["HCE Average Benefit"] || 0;
  const nhceAvgBenefit = result?.["NHCE Average Benefit"] || 0;
  const employerAvg = result?.["Employer Contributions (Avg)"] || 0;
  const employeeAvg = result?.["Employee Contributions (Avg)"] || 0;
  const hceNhceRatio = result?.["HCE/NHCE Ratio"] || 0;

  const barData = [
    { group: "HCE", benefit: hceAvgBenefit },
    { group: "NHCE", benefit: nhceAvgBenefit },
  ];

  const contributionsPieData = [
    { name: "Employer", value: employerAvg },
    { name: "Employee", value: employeeAvg },
  ];

  const stackedBarData = [
    {
      group: "HCE",
      employer: employerAvg,
      employee: employeeAvg,
      benefits: hceAvgBenefit,
    },
    {
      group: "NHCE",
      employer: 0, // adjust if you have values
      employee: 0,
      benefits: nhceAvgBenefit,
    },
  ];

  const gaugeData = [
    {
      name: "Ratio",
      value: hceNhceRatio,
      fill: hceNhceRatio > 1.25 ? "#FF4136" : "#2ECC40",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10 text-sm">
      {/* HCE vs NHCE Average Benefits */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          HCE vs NHCE Average Benefits
        </h3>
        <BarChart width={400} height={250} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="group" label={{ value: "Group", position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: "Avg Benefit ($)", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
          <Bar dataKey="benefit" fill="#0074D9" name="Average Benefit" />
        </BarChart>
      </div>

      {/* Contributions Pie Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          Employer vs Employee Contributions
        </h3>
        <PieChart width={400} height={250}>
          <Pie
            data={contributionsPieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            dataKey="value"
          >
            {contributionsPieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          <Tooltip />
        </PieChart>
      </div>

      {/* Stacked Bar Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          Benefits vs Contributions by Group
        </h3>
        <BarChart width={450} height={300} data={stackedBarData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="group" label={{ value: "Group", position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: "Amount ($)", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="employer" stackId="a" fill="#0074D9" name="Employer Contribution" />
          <Bar dataKey="employee" stackId="a" fill="#7FDBFF" name="Employee Contribution" />
          <Bar dataKey="benefits" stackId="b" fill="#2ECC40" name="Benefits" />
        </BarChart>
      </div>

      {/* HCE/NHCE Ratio Gauge */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800">HCE/NHCE Ratio</h3>
        <RadialBarChart
          width={300}
          height={250}
          innerRadius="80%"
          outerRadius="100%"
          barSize={20}
          data={gaugeData}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            minAngle={15}
            background
            clockWise
            dataKey="value"
          />
          <text
            x={150}
            y={125}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 20, fontWeight: "bold", fill: "#333" }}
          >
            {`Ratio: ${hceNhceRatio}`}
          </text>
        </RadialBarChart>
      </div>
    </div>
  );
};

export default CafeConBenCharts;
