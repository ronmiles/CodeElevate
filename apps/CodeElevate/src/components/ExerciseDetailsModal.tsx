import React from 'react';
import {
  Typography,
  Chip,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { Exercise } from '../api/exercises.api';

interface ExerciseDetailsOverlayProps {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}

export const ExerciseDetailsOverlay: React.FC<ExerciseDetailsOverlayProps> = ({
  open,
  onClose,
  exercise,
}) => {
  const navigate = useNavigate();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      className="bg-background"
    >
      <DialogTitle className="bg-secondary-background border-b border-border">
        <div className="flex justify-between items-center">
          <span className="text-text font-semibold">
            {exercise?.title || 'Exercise Details'}
          </span>
          <IconButton
            onClick={onClose}
            className="text-text-secondary hover:text-text"
          >
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent className="bg-secondary-background">
        {exercise ? (
          <div className="py-6">
            <div className="mb-6">
              <Typography variant="h6" className="text-text mb-2">
                Description
              </Typography>
              <Typography className="text-text-secondary">
                {exercise.description}
              </Typography>
            </div>

            <div className="mb-6">
              <Typography variant="h6" className="text-text mb-2">
                Details
              </Typography>
              <div className="flex flex-wrap gap-3">
                <Chip
                  label={`Difficulty: ${exercise.difficulty}`}
                  className="bg-primary bg-opacity-10 text-primary border border-primary"
                />
                <Chip
                  label={`Language: ${exercise.language.name}`}
                  className="bg-info bg-opacity-10 text-info border border-info"
                />
              </div>
            </div>

            {exercise.hints && exercise.hints.length > 0 && (
              <div className="mb-6">
                <Typography variant="h6" className="text-text mb-2">
                  Hints
                </Typography>
                <ul className="list-disc pl-5">
                  {exercise.hints.map((hint, index) => (
                    <li key={index} className="text-text-secondary mb-1">
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <Button
                variant="contained"
                className="bg-primary hover:bg-primary-dark"
                onClick={() => {
                  onClose();
                  navigate(`/exercise/${exercise.id}`);
                }}
              >
                Start Exercise
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 flex justify-center">
            <CircularProgress />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
