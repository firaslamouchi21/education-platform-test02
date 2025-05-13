import React, { useEffect, useState } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../store/slices/courseSlice';
import { RootState } from '../store';

const validationSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  level: yup
    .string()
    .oneOf(['A1', 'A2', 'B1', 'B2', 'C1'], 'Invalid level')
    .required('Level is required'),
  category: yup
    .string()
    .oneOf(['medical', 'engineering', 'general'], 'Invalid category')
    .required('Category is required'),
});

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { courses, loading } = useSelector((state: RootState) => state.courses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: '',
    level: '',
    category: '',
  });

  useEffect(() => {
    dispatch(fetchCourses(filters));
  }, [dispatch, filters]);

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      level: 'A1',
      category: 'general',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (selectedCourse) {
        await dispatch(updateCourse({ id: selectedCourse.id, courseData: values }));
      } else {
        await dispatch(createCourse(values));
      }
      handleCloseDialog();
    },
  });

  const handleOpenDialog = (course?: any) => {
    if (course) {
      setSelectedCourse(course);
      formik.setValues({
        title: course.title,
        description: course.description,
        level: course.level,
        category: course.category,
      });
    } else {
      setSelectedCourse(null);
      formik.resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCourse(null);
    formik.resetForm();
  };

  const handleDeleteCourse = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      await dispatch(deleteCourse(id));
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1">
            Courses
          </Typography>
          {user?.role === 'teacher' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Course
            </Button>
          )}
        </Box>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={filters.level}
                label="Level"
                onChange={(e) =>
                  setFilters({ ...filters, level: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="A1">A1</MenuItem>
                <MenuItem value="A2">A2</MenuItem>
                <MenuItem value="B1">B1</MenuItem>
                <MenuItem value="B2">B2</MenuItem>
                <MenuItem value="C1">C1</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="medical">Medical</MenuItem>
                <MenuItem value="engineering">Engineering</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : courses.length > 0 ? (
          <Grid container spacing={3}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
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
                        mb: 2,
                      }}
                    >
                      {course.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap',
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
                        {course.level}
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
                        {course.category}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      View Details
                    </Button>
                    {user?.role === 'teacher' &&
                      user?.id === course.teacher_id && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(course)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            No courses found.
          </Typography>
        )}
      </Box>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCourse ? 'Edit Course' : 'Create Course'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              name="title"
              label="Title"
              value={formik.values.title}
              onChange={formik.handleChange}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
            />
            <TextField
              fullWidth
              margin="normal"
              name="description"
              label="Description"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={formik.touched.description && formik.errors.description}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Level</InputLabel>
              <Select
                name="level"
                value={formik.values.level}
                label="Level"
                onChange={formik.handleChange}
                error={formik.touched.level && Boolean(formik.errors.level)}
              >
                <MenuItem value="A1">A1</MenuItem>
                <MenuItem value="A2">A2</MenuItem>
                <MenuItem value="B1">B1</MenuItem>
                <MenuItem value="B2">B2</MenuItem>
                <MenuItem value="C1">C1</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formik.values.category}
                label="Category"
                onChange={formik.handleChange}
                error={formik.touched.category && Boolean(formik.errors.category)}
              >
                <MenuItem value="medical">Medical</MenuItem>
                <MenuItem value="engineering">Engineering</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedCourse ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Courses; 