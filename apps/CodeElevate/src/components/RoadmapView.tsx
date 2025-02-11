import React from 'react';
import { Box, VStack, HStack, Text, Progress, Badge, Button, useToast } from '@chakra-ui/react';
import { CheckIcon, TimeIcon } from '@chakra-ui/icons';
import { Roadmap, Checkpoint, roadmapApi } from '../api/roadmap.api';
import { useAuth } from '../hooks/useAuth';

interface RoadmapViewProps {
  roadmap: Roadmap;
  onCheckpointClick?: (checkpoint: Checkpoint) => void;
}

const getStatusColor = (status: Checkpoint['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'green';
    case 'IN_PROGRESS':
      return 'blue';
    case 'NOT_STARTED':
    default:
      return 'gray';
  }
};

const getStatusIcon = (status: Checkpoint['status']) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckIcon />;
    case 'IN_PROGRESS':
      return <TimeIcon />;
    case 'NOT_STARTED':
    default:
      return null;
  }
};

const getProgressValue = (checkpoints: Checkpoint[]) => {
  const completed = checkpoints.filter((cp) => cp.status === 'COMPLETED').length;
  return (completed / checkpoints.length) * 100;
};

export const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, onCheckpointClick }) => {
  const { token } = useAuth();
  const toast = useToast();

  const handleStatusUpdate = async (checkpoint: Checkpoint, newStatus: Checkpoint['status']) => {
    try {
      await roadmapApi.updateCheckpointStatus(checkpoint.id, newStatus, token);
      toast({
        title: 'Status updated',
        description: `Checkpoint "${checkpoint.title}" status updated to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating status',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box w="full" p={4}>
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Learning Progress
          </Text>
          <Progress
            value={getProgressValue(roadmap.checkpoints)}
            size="lg"
            colorScheme="green"
            borderRadius="md"
          />
        </Box>

        {roadmap.checkpoints.map((checkpoint) => (
          <Box
            key={checkpoint.id}
            p={4}
            borderWidth={1}
            borderRadius="lg"
            _hover={{ shadow: 'md' }}
            cursor="pointer"
            onClick={() => onCheckpointClick?.(checkpoint)}
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={2}>
                <HStack>
                  <Badge colorScheme={getStatusColor(checkpoint.status)} px={2} py={1}>
                    {getStatusIcon(checkpoint.status)}
                    <Text ml={1}>{checkpoint.status.replace('_', ' ')}</Text>
                  </Badge>
                  <Text fontWeight="bold">{checkpoint.title}</Text>
                </HStack>
                <Text color="gray.600">{checkpoint.description}</Text>
              </VStack>

              <HStack>
                {checkpoint.status !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(checkpoint, 'COMPLETED');
                    }}
                  >
                    Mark Complete
                  </Button>
                )}
                {checkpoint.status === 'NOT_STARTED' && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(checkpoint, 'IN_PROGRESS');
                    }}
                  >
                    Start
                  </Button>
                )}
              </HStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}; 