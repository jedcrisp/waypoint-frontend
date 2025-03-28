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
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Label,
} from "recharts";

const COLORS = ["#0074D9", "#FF4136"];

const Charts = () => {
  const hceAvgBenefit = 616.67;
  const nhceAvgBenefit = 300.0;
  const employerAvg = 1514.29;
  const employeeAvg = 885.71;
  const hceNhceRatio = 2.06;

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
      employer: 1514.29,
      employee: 885.71,
      benefits: 616.67,
    },
    {
      group: "NHCE",
      employer: 0, // Adjust if available
      employee: 0, // Adjust if available
      benefits: 300.0,
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
      {/* HCE vs NHCE Average Benefits */}
      <div>
        <h3 className="text-xl font-bold mb-2">HCE vs NHCE Average Benefits</h3>
        <BarChart width={400} height={250} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="group" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="benefit" fill="#0074D9" />
        </BarChart>
      </div>

      {/* Contributions Pie Chart */}
      <div>
        <h3 className="text-xl font-bold mb-2">Employer vs Employee Contributions</h3>
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
          <Tooltip />
        </PieChart>
      </div>

      {/* Stacked Bar Chart */}
      <div>
        <h3 className="text-xl font-bold mb-2">Benefits vs Contributions by Group</h3>
        <BarChart width={450} height={300} data={stackedBarData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="group" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="employer" stackId="a" fill="#0074D9" name="Employer Contribution" />
          <Bar dataKey="employee" stackId="a" fill="#7FDBFF" name="Employee Contribution" />
          <Bar dataKey="benefits" stackId="b" fill="#2ECC40" name="Benefits" />
        </BarChart>
      </div>

      {/* HCE/NHCE Ratio Gauge */}
      <div>
        <h3 className="text-xl font-bold mb-2">HCE/NHCE Ratio</h3>
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
            label={{ position: "insideStart", fill: "#000" }}
            background
            clockWise
            dataKey="value"
          />
          <Label
            value={`Ratio: ${hceNhceRatio}`}
            position="center"
            style={{ fontSize: 16, fill: "#333" }}
          />
        </RadialBarChart>
      </div>
    </div>
  );
};

export default Charts;
