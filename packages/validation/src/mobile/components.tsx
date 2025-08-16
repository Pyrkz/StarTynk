import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

// Error message component for React Native
export interface ValidationErrorProps {
  error?: string | string[];
  style?: any;
  testID?: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  error,
  style,
  testID = 'validation-error',
}) => {
  if (!error) return null;
  
  const errorMessage = Array.isArray(error) ? error[0] : error;
  
  return (
    <View style={[styles.errorContainer, style]} testID={testID}>
      <Text style={styles.errorText}>{errorMessage}</Text>
    </View>
  );
};

// Field wrapper with error display
export interface ValidationFieldProps {
  error?: string | string[];
  children: React.ReactNode;
  label?: string;
  required?: boolean;
  style?: any;
}

export const ValidationField: React.FC<ValidationFieldProps> = ({
  error,
  children,
  label,
  required,
  style,
}) => {
  return (
    <View style={[styles.fieldContainer, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      {children}
      <ValidationError error={error} />
    </View>
  );
};

// Form error summary
export interface ValidationSummaryProps {
  errors: Record<string, string[]>;
  style?: any;
  title?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  style,
  title = 'Please fix the following errors:',
}) => {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) return null;
  
  return (
    <View style={[styles.summaryContainer, style]}>
      <Text style={styles.summaryTitle}>{title}</Text>
      {errorEntries.map(([field, fieldErrors]) => (
        <View key={field} style={styles.summaryItem}>
          <Text style={styles.summaryField}>{formatFieldName(field)}:</Text>
          {fieldErrors.map((error, index) => (
            <Text key={index} style={styles.summaryError}>
              • {error}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

// Helper to format field names
function formatFieldName(field: string): string {
  return field
    .split('.')
    .pop()!
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

const styles = StyleSheet.create({
  errorContainer: {
    marginTop: 4,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    lineHeight: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  required: {
    color: '#dc2626',
  },
  summaryContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 8,
  },
  summaryItem: {
    marginBottom: 4,
  },
  summaryField: {
    fontSize: 13,
    fontWeight: '500',
    color: '#dc2626',
  },
  summaryError: {
    fontSize: 12,
    color: '#7f1d1d',
    marginLeft: 12,
    marginTop: 2,
  },
});