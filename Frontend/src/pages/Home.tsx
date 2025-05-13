import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { School as SchoolIcon, Chat as ChatIcon } from '@mui/icons-material';
import { fetchCourses } from '../store/slices/courseSlice';
import { RootState } from '../store';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { courses, loading } = useSelector((state: RootState) => state.courses);

  useEffect(() => {
    dispatch(fetchCourses({}));
  }, [dispatch]);

  const recentCourses = courses.slice(0, 3);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.email}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {user?.role === 'teacher'
            ? 'Manage your courses and interact with students'
            : 'Continue learning and explore new courses'}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Recent Courses
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : recentCourses.length > 0 ? (
              <Grid container spacing={3}>
                {recentCourses.map((course) => (
                  <Grid item xs={12} sm={6} md={4} key={course.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {course.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {course.description}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No courses available.
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <SchoolIcon sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h3">
                        {user?.role === 'teacher'
                          ? 'Manage Courses'
                          : 'Browse Courses'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {user?.role === 'teacher'
                        ? 'Create, edit, and manage your courses'
                        : 'Explore and enroll in new courses'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/courses')}>
                      Go to Courses
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <ChatIcon sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h3">
                        Chat
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {user?.role === 'teacher'
                        ? 'Communicate with your students'
                        : 'Connect with teachers and classmates'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate('/chat')}>
                      Open Chat
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 