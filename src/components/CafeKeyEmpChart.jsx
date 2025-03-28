import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList
} from "recharts";

const COLORS = ["#0074D9", "#FF4136"];

const CafeKeyEmpChart = ({ result }) => {
  if (!result) return null;

  const totalBenefits = result["Total Benefits"] || 0;
  const keyEmployeeBenefits = result["Key Employee Benefits"] || 0;
  const percentage = result["Key Employee Benefit Percentage"] || 0;
  const keyEmployeeCount = result["Key Employees"] || 0;
  const totalParticipants = result["Total Participants"] || 0;
  const nonKeyCount = totalParticipants - keyEmployeeCount;

  const benefitData = [
    { name: "Key Employees", value: keyEmployeeBenefits },
    { name: "Others", value: totalBenefits - keyEmployeeBenefits },
  ];

  const participantData = [
    { name: "Key Employees", value: keyEmployeeCount },
    { name: "Non-Key Employees", value: nonKeyCount },
  ];

  const stackedData = [
    {
      group: "Benefits",
      Key: keyEmployeeBenefits,
      NonKey: totalBenefits - keyEmployeeBenefits,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
      {/* Benefits Distribution */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-center">Key vs Other Employee Benefits</h3>
        <BarChart width={400} height={250} data={benefitData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#0074D9" name="Benefit Amount" />
        </BarChart>
      </div>

      {/* Key Employee % Stacked Bar */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-center">Key Employee Benefit % (Stacked)</h3>
        <BarChart width={400} height={250} data={stackedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="group" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Key" stackId="a" fill="#FF4136" name="Key Employees" />
          <Bar dataKey="NonKey" stackId="a" fill="#0074D9" name="Non-Key Employees" />
        </BarChart>
      </div>

      {/* Participants Breakdown */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-center">Participant Breakdown</h3>
        <PieChart width={350} height={250}>
          <Pie
            data={participantData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
          >
            {participantData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
};

export default CafeKeyEmpChart;
