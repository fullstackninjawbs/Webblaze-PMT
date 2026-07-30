import React from 'react';
import { Modal, Text, Group, Button, Box } from '@mantine/core';
import { AlertTriangle } from 'lucide-react';

interface Props {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  description?: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<Props> = ({
  opened,
  onClose,
  onConfirm,
  title = 'Delete Item',
  itemName,
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  loading = false,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      radius="lg"
      padding="xl"
      withCloseButton={false}
      styles={{
        content: {
          border: '1px solid rgba(244, 63, 94, 0.25)',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
        },
      }}
    >
      <Box style={{ textAlign: 'center', paddingTop: '8px', paddingBottom: '8px' }}>
        {/* Red Danger Warning Icon Badge */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <AlertTriangle size={28} color="#f43f5e" />
        </div>

        <Text fw={800} size="xl" style={{ color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          {title}
        </Text>

        <Text size="sm" style={{ color: '#475569', lineHeight: 1.5, marginBottom: '24px', maxWidth: '340px', margin: '0 auto 24px auto' }}>
          {itemName ? (
            <>
              Are you sure you want to delete <strong style={{ color: '#0f172a' }}>"{itemName}"</strong>? This action is permanent and cannot be undone.
            </>
          ) : (
            description
          )}
        </Text>

        <Group justify="center" gap="md">
          <Button
            variant="default"
            radius="md"
            size="md"
            onClick={onClose}
            disabled={isDeleting || loading}
            style={{ fontWeight: 600, color: '#475569', minWidth: '110px' }}
          >
            Cancel
          </Button>
          <Button
            radius="md"
            size="md"
            onClick={handleConfirm}
            loading={isDeleting || loading}
            style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)',
              fontWeight: 600,
              minWidth: '130px',
              border: 'none',
            }}
          >
            Delete Item
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};

export default DeleteConfirmModal;
