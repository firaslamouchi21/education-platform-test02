import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
  TextField,
  IconButton,
} from '@mui/material';
import { Send as SendIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { fetchCourseById } from '../store/slices/courseSlice';
import { fetchMessages, sendMessage, deleteMessage } from '../store/slices/chatSlice';
import { RootState } from '../store';

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState('');
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentCourse, loading: courseLoading } = useSelector(
    (state: RootState) => state.courses
  );
  const { messages, loading: chatLoading } = useSelector(
    (state: RootState) => state.chat
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseById(parseInt(id)));
      dispatch(fetchMessages(parseInt(id)));
    }
  }, [dispatch, id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && id) {
      await dispatch(sendMessage({ courseId: parseInt(id), message: newMessage }));
      setNewMessage('');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (id && window.confirm('Are you sure you want to delete this message?')) {
      await dispatch(deleteMessage({ courseId: parseInt(id), messageId }));
    }
  };

  if (courseLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentCourse) {
    return (
      <Container>
        <Typography variant="h5" sx={{ mt: 4 }}>
          Course not found
        </Typography>
        <Button onClick={() => navigate('/courses')} sx={{ mt: 2 }}>
          Back to Courses
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Button onClick={() => navigate('/courses')} sx={{ mb: 2 }}>
          Back to Courses
        </Button>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h4" component="h1" gutterBottom>
                  {currentCourse.title}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {currentCourse.level}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {currentCourse.category}
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph>
                  {currentCourse.description}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Teacher: {currentCourse.teacher_email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Course Chat
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    height: 400,
                    overflowY: 'auto',
                    mb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {chatLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          mb: 1,
                          p: 1,
                          bgcolor:
                            message.sender_id === user?.id
                              ? 'primary.light'
                              : 'grey.100',
                          borderRadius: 1,
                          alignSelf:
                            message.sender_id === user?.id
                              ? 'flex-end'
                              : 'flex-start',
                          maxWidth: '80%',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {message.sender_email}
                        </Typography>
                        <Typography variant="body2">{message.message}</Typography>
                        {(user?.role === 'teacher' ||
                          message.sender_id === user?.id) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMessage(message.id)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      No messages yet
                    </Typography>
                  )}
                </Box>
                <form onSubmit={handleSendMessage}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <IconButton
                      type="submit"
                      color="primary"
                      disabled={!newMessage.trim()}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CourseDetails; 