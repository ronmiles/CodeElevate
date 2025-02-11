import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useToast,
  Spinner,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { goalApi } from '../api/goal.api';
import { useAuth } from '../hooks/useAuth';
import { RoadmapView } from '../components/RoadmapView';
import { CheckpointExercises } from '../components/CheckpointExercises';
import { Checkpoint } from '../api/roadmap.api';

export const GoalDetail = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const { token } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);

  const { data: goal, isLoading } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalApi.getGoal(goalId!, token),
    enabled: !!goalId && !!token,
  });

  const handleCheckpointClick = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    onOpen();
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!goal) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Goal not found</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={2}>
              <Heading size="lg">{goal.title}</Heading>
              <Text color="gray.600">{goal.description}</Text>
            </VStack>
            <Badge
              colorScheme={
                goal.status === 'COMPLETED'
                  ? 'green'
                  : goal.status === 'IN_PROGRESS'
                  ? 'blue'
                  : goal.status === 'ABANDONED'
                  ? 'red'
                  : 'gray'
              }
              p={2}
              borderRadius="md"
            >
              {goal.status.replace('_', ' ')}
            </Badge>
          </HStack>
        </Box>

        {goal.roadmap && <RoadmapView roadmap={goal.roadmap} onCheckpointClick={handleCheckpointClick} />}
      </VStack>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Checkpoint Exercises</DrawerHeader>
          <DrawerBody>
            {selectedCheckpoint && <CheckpointExercises checkpoint={selectedCheckpoint} />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Container>
  );
}; 