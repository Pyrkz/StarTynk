import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  text?: string;
  subText?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 250,
  strokeWidth = 20,
  text,
  subText,
}) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const startAngle = -135; // Start from bottom left
  const endAngle = 135; // End at bottom right
  const totalAngle = endAngle - startAngle;

  // Calculate the angle for the current value
  const valueAngle = startAngle + (value / 100) * totalAngle;

  // Convert angles to radians
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;
  const valueAngleRad = (valueAngle * Math.PI) / 180;

  // Helper function to create arc path
  const createArcPath = (startRad: number, endRad: number) => {
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArcFlag = endRad - startRad > Math.PI ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // Get color based on value
  const getColor = (val: number) => {
    if (val === 100) return '#22c55e'; // Green
    if (val >= 70) return '#f59e0b'; // Orange
    if (val >= 50) return '#f97316'; // Dark orange
    return '#ef4444'; // Red
  };

  const progressColor = getColor(value);

  // Create segments for the background arc
  const segments = [
    { start: -135, end: -90, color: '#ef4444' }, // Red
    { start: -90, end: -45, color: '#f97316' }, // Dark orange
    { start: -45, end: 0, color: '#f59e0b' }, // Orange
    { start: 0, end: 45, color: '#fbbf24' }, // Yellow
    { start: 45, end: 90, color: '#84cc16' }, // Light green
    { start: 90, end: 135, color: '#22c55e' }, // Green
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>
          {/* Background segments */}
          {segments.map((segment, index) => {
            const segmentStartRad = (segment.start * Math.PI) / 180;
            const segmentEndRad = (segment.end * Math.PI) / 180;
            return (
              <Path
                key={index}
                d={createArcPath(segmentStartRad, segmentEndRad)}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeOpacity={0.3}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}

          {/* Progress arc */}
          <Path
            d={createArcPath(startAngleRad, valueAngleRad)}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />

          {/* Indicator triangle */}
          <G
            rotation={valueAngle}
            origin={`${center}, ${center}`}
          >
            <Path
              d={`M ${center} ${center - radius + strokeWidth - 5} L ${center - 8} ${center - radius + strokeWidth + 10} L ${center + 8} ${center - radius + strokeWidth + 10} Z`}
              fill="white"
            />
          </G>
        </G>
      </Svg>

      {/* Center text */}
      <View style={styles.textContainer}>
        <Text style={[styles.valueText, { color: progressColor }]}>
          {value}%
        </Text>
        {text && <Text style={styles.labelText}>{text}</Text>}
        {subText && <Text style={styles.subText}>{subText}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  labelText: {
    fontSize: 18,
    color: '#333',
    marginTop: 4,
  },
  subText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default CircularProgress;