import React from "react";

interface ProgressBarProps {
  current: number; // current question index
  total: number;   // total number of questions
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = Math.round(((current + 1) / total) * 100);

  return (
    <div style={{ margin: "10px 0" }}>
      <div
        style={{
          height: "10px",
          width: "100%",
          backgroundColor: "#d9d2c3",
          borderRadius: "5px",
        }}
      >
        <div
          style={{
            height: "10px",
            width: `${percentage}%`,
            backgroundColor: "#d9822b",
            borderRadius: "5px",
            transition: "width 0.3s",
          }}
        ></div>
      </div>
      <p style={{ fontSize: "12px", textAlign: "right", margin: "5px 0 0 0" }}>
        {current + 1} / {total}
      </p>
    </div>
  );
};

export default ProgressBar;
