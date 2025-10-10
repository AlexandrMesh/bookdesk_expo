import React, { memo, JSX, FC, Fragment } from 'react';
import { View, Pressable, Text } from 'react-native';
import styles from './styles';

export type Props = {
  steps: {
    step: number;
    component: JSX.Element;
  }[];

  onStepPress: (step: number) => void;
  lastAvailableStep: number;
  currentStep: number;
};

const Stepper: FC<Props> = ({ steps, currentStep, lastAvailableStep, onStepPress }) => {
  return (
    <>
      <View style={styles.stepper}>
        {steps.map(({ step }, index) => (
          <Fragment key={step}>
            <Pressable
              style={[styles.step, currentStep === step && styles.currentStep, step <= lastAvailableStep && styles.availableStep]}
              onPress={() => {
                if (step <= lastAvailableStep) {
                  onStepPress(step);
                }
              }}
            >
              <Text style={[styles.label, currentStep === step && styles.currentLabel, step <= lastAvailableStep && styles.availableLabel]}>
                {step}
              </Text>
            </Pressable>
            {steps.length > index + 1 && <View style={[styles.line, step < lastAvailableStep && styles.activeLine]} />}
          </Fragment>
        ))}
      </View>
      <View style={styles.componentWrapper}>
        <View style={styles.component}>{steps.find(({ step }) => step === currentStep)?.component}</View>
      </View>
    </>
  );
};

export default memo(Stepper);
