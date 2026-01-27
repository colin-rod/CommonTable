'use client';

import type { UnitSystem } from '@commontable/types';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Button, Stack, Typography, TextField } from '@mui/material';
import { useState, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';

interface ServingsScalerProps {
  /** Original servings from the recipe */
  originalServings: number;
  /** Current target servings */
  targetServings: number;
  /** Callback when servings change */
  onServingsChange: (servings: number) => void;
  /** Current unit system */
  unitSystem: UnitSystem;
  /** Callback when unit system changes */
  onUnitSystemChange: (system: UnitSystem) => void;
}

/**
 * ServingsScaler Component
 *
 * Provides controls for scaling recipe servings and switching between
 * metric and imperial unit systems.
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses Button for actions (outlined for secondary)
 * - Uses Stack for layout
 * - body2 for labels
 */
export function ServingsScaler({
  originalServings,
  targetServings,
  onServingsChange,
  unitSystem,
  onUnitSystemChange,
}: ServingsScalerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(targetServings.toString());

  const scaleFactor = targetServings / originalServings;
  const isScaled = scaleFactor !== 1;

  const handleDecrement = useCallback(() => {
    if (targetServings > 1) {
      onServingsChange(targetServings - 1);
    }
  }, [targetServings, onServingsChange]);

  const handleIncrement = useCallback(() => {
    onServingsChange(targetServings + 1);
  }, [targetServings, onServingsChange]);

  const handleQuickScale = useCallback(
    (factor: number) => {
      const newServings = Math.max(1, Math.round(originalServings * factor));
      onServingsChange(newServings);
    },
    [originalServings, onServingsChange],
  );

  const handleReset = useCallback(() => {
    onServingsChange(originalServings);
  }, [originalServings, onServingsChange]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      onServingsChange(parsed);
    } else {
      setInputValue(targetServings.toString());
    }
    setIsEditing(false);
  }, [inputValue, targetServings, onServingsChange]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleInputBlur();
      } else if (event.key === 'Escape') {
        setInputValue(targetServings.toString());
        setIsEditing(false);
      }
    },
    [handleInputBlur, targetServings],
  );

  const handleStartEditing = useCallback(() => {
    setInputValue(targetServings.toString());
    setIsEditing(true);
  }, [targetServings]);

  return (
    <Stack spacing={2}>
      {/* Servings adjuster */}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleDecrement}
            disabled={targetServings <= 1}
            aria-label="Decrease servings"
            sx={{ minWidth: 36, px: 1 }}
          >
            <RemoveIcon fontSize="small" />
          </Button>

          {isEditing ? (
            <TextField
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              size="small"
              type="number"
              inputProps={{ min: 1, style: { textAlign: 'center', width: 48 } }}
              autoFocus
            />
          ) : (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleStartEditing}
              sx={{ minWidth: 64 }}
            >
              {targetServings}
            </Button>
          )}

          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={handleIncrement}
            aria-label="Increase servings"
            sx={{ minWidth: 36, px: 1 }}
          >
            <AddIcon fontSize="small" />
          </Button>

          <Typography variant="body2" color="text.secondary">
            servings
          </Typography>
        </Stack>

        {/* Quick scale buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => handleQuickScale(0.5)}
          >
            0.5x
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => handleQuickScale(1)}
            disabled={!isScaled}
          >
            1x
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => handleQuickScale(2)}
          >
            2x
          </Button>
        </Stack>

        {/* Reset button (only shown when scaled) */}
        {isScaled && (
          <Button variant="outlined" color="primary" size="small" onClick={handleReset}>
            Reset
          </Button>
        )}
      </Stack>

      {/* Unit system toggle */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Units:
        </Typography>
        <Button
          variant={unitSystem === 'imperial' ? 'contained' : 'outlined'}
          color="primary"
          size="small"
          onClick={() => onUnitSystemChange('imperial')}
        >
          Imperial
        </Button>
        <Button
          variant={unitSystem === 'metric' ? 'contained' : 'outlined'}
          color="primary"
          size="small"
          onClick={() => onUnitSystemChange('metric')}
        >
          Metric
        </Button>
      </Stack>
    </Stack>
  );
}
