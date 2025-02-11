import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Heading,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { Checkpoint } from '../api/roadmap.api';
import { useQuery } from '@tanstack/react-query';
import { exercisesApi } from '../api/exercises.api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface CheckpointExercisesProps {
  checkpoint: Checkpoint;
}

export const CheckpointExercises: React.FC<CheckpointExercisesProps> = ({ checkpoint }) => {
  const { token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['checkpoint-exercises', checkpoint.id],
    queryFn: () => exercisesApi.getCheckpointExercises(checkpoint.id, token),
  });

  const handleGenerateExercise = async (goalId: string, languageId: string) => {
    try {
      const exercise = await exercisesApi.generateExercise(goalId, languageId, checkpoint.id, token);
      toast({
        title: 'Exercise generated',
        description: 'New exercise has been created for this checkpoint',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate(`/exercise/${exercise.id}`);
    } catch (error) {
      toast({
        title: 'Error generating exercise',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box w="full" p={4}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" mb={2}>
            {checkpoint.title}
          </Heading>
          <Text color="gray.600">{checkpoint.description}</Text>
        </Box>

        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="sm">Exercises</Heading>
            <Button
              colorScheme="blue"
              onClick={() => handleGenerateExercise(exercises[0]?.goalId, exercises[0]?.languageId)}
              isDisabled={!exercises?.length}
            >
              Generate New Exercise
            </Button>
          </HStack>

          {exercises?.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No exercises available for this checkpoint yet.</Text>
            </Box>
          ) : (
            <VStack spacing={4}>
              {exercises?.map((exercise) => (
                <Box
                  key={exercise.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="lg"
                  _hover={{ shadow: 'md' }}
                  cursor="pointer"
                  onClick={() => navigate(`/exercise/${exercise.id}`)}
                  w="full"
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">{exercise.title}</Text>
                      <HStack>
                        <Badge colorScheme="purple">{exercise.language.name}</Badge>
                        <Badge colorScheme={exercise.difficulty === 'EASY' ? 'green' : exercise.difficulty === 'MEDIUM' ? 'yellow' : 'red'}>
                          {exercise.difficulty}
                        </Badge>
                        {exercise.progress?.[0] && (
                          <Badge colorScheme={exercise.progress[0].status === 'COMPLETED' ? 'green' : 'blue'}>
                            {exercise.progress[0].status.replace('_', ' ')}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/exercise/${exercise.id}`);
                      }}
                    >
                      Start Exercise
                    </Button>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
}; 