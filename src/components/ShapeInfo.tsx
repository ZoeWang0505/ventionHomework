
const ShapeInfo = ({ 
  label,
  shape = 'circle', 
  color = '#3b82f6', // Default Tailwind Blue 500
  size = 64, 
}) => {

  const blockStyle = {
    backgroundColor: color,
    width: `100%`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: '8px', // Slightly rounded corners for aesthetics
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    margin: '0 2 2 0',
  };

  return (
    <div style={blockStyle}>
      {label} {shape}
    </div>
  );
};

export default ShapeInfo;