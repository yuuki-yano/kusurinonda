import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Alert,
  Fab,
  TextField,
} from '@mui/material';
import { LogoutOutlined, AdminPanelSettings, History, Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface MedicationRecord {
  id: number;
  date: string;
  morning_taken: boolean;
  afternoon_taken: boolean;
  evening_taken: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<MedicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/medication-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRecords(response.data);
      const today_record = response.data.find((record: MedicationRecord) => record.date === today);
      setTodayRecord(today_record || null);
      setLoading(false);
    } catch (error) {
      setError('データの読み込みに失敗しました');
      setLoading(false);
    }
  };

  const updateTodayRecord = async (morning: boolean, afternoon: boolean, evening: boolean) => {
    try {
      const recordData = {
        date: today,
        morning_taken: morning,
        afternoon_taken: afternoon,
        evening_taken: evening,
      };

      let response;
      if (todayRecord) {
        response = await axios.put(`${API_URL}/medication-records/${todayRecord.id}`, recordData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_URL}/medication-records`, recordData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setTodayRecord(response.data);
      fetchRecords();
    } catch (error) {
      setError('更新に失敗しました');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            薬飲み忘れ管理
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.username}さん
          </Typography>
          <Button
            color="inherit"
            onClick={() => navigate('/past-records')}
            startIcon={<History />}
            sx={{ mr: 1 }}
          >
            過去記録
          </Button>
          {user?.is_admin && (
            <IconButton
              color="inherit"
              onClick={() => navigate('/admin')}
              title="管理画面"
            >
              <AdminPanelSettings />
            </IconButton>
          )}
          <IconButton color="inherit" onClick={handleLogout} title="ログアウト">
            <LogoutOutlined />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h4" gutterBottom>
          今日の薬の記録
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    朝
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={todayRecord?.morning_taken || false}
                        onChange={(e) => updateTodayRecord(
                          e.target.checked,
                          todayRecord?.afternoon_taken || false,
                          todayRecord?.evening_taken || false
                        )}
                        color="primary"
                        size="large"
                      />
                    }
                    label="飲んだ"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    昼
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={todayRecord?.afternoon_taken || false}
                        onChange={(e) => updateTodayRecord(
                          todayRecord?.morning_taken || false,
                          e.target.checked,
                          todayRecord?.evening_taken || false
                        )}
                        color="primary"
                        size="large"
                      />
                    }
                    label="飲んだ"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    夜
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={todayRecord?.evening_taken || false}
                        onChange={(e) => updateTodayRecord(
                          todayRecord?.morning_taken || false,
                          todayRecord?.afternoon_taken || false,
                          e.target.checked
                        )}
                        color="primary"
                        size="large"
                      />
                    }
                    label="飲んだ"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        <Typography variant="h5" gutterBottom>
          過去の記録
        </Typography>
        
        <Grid container spacing={2}>
          {records.slice(-7).reverse().map((record) => (
            <Grid item xs={12} key={record.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {new Date(record.date).toLocaleDateString('ja-JP')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      朝: {record.morning_taken ? '✓' : '✗'}
                    </Grid>
                    <Grid item xs={4}>
                      昼: {record.afternoon_taken ? '✓' : '✗'}
                    </Grid>
                    <Grid item xs={4}>
                      夜: {record.evening_taken ? '✓' : '✗'}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
