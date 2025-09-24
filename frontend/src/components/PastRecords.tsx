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
  TextField,
  Button,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
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

const PastRecords: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRecentRecords();
  }, []);

  const fetchRecentRecords = async () => {
    try {
      const response = await axios.get(`${API_URL}/medication-records/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 3日分のデータを確実に作成
      const today = new Date();
      const dates = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const recordsWithDefaults = dates.map(dateStr => {
        const existingRecord = response.data.find((r: MedicationRecord) => r.date === dateStr);
        return existingRecord || {
          id: null,
          date: dateStr,
          morning_taken: false,
          afternoon_taken: false,
          evening_taken: false,
          notes: '',
          created_at: '',
          updated_at: ''
        };
      });

      setRecords(recordsWithDefaults);
      setLoading(false);
    } catch (error) {
      setError('データの読み込みに失敗しました');
      setLoading(false);
    }
  };

  const updateRecord = async (record: MedicationRecord) => {
    try {
      setError('');
      setSuccess('');

      const recordData = {
        date: record.date,
        morning_taken: record.morning_taken,
        afternoon_taken: record.afternoon_taken,
        evening_taken: record.evening_taken,
        notes: record.notes || ''
      };

      let response;
      if (record.id) {
        // 既存レコードの更新
        response = await axios.put(`${API_URL}/medication-records/${record.id}`, recordData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // 新規レコードの作成
        response = await axios.post(`${API_URL}/medication-records`, recordData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // ローカル状態を更新
      setRecords(prev => prev.map(r => 
        r.date === record.date ? response.data : r
      ));

      setSuccess('保存しました！');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('更新に失敗しました');
    }
  };

  const handleRecordChange = (date: string, field: string, value: boolean | string) => {
    setRecords(prev => prev.map(record => 
      record.date === date ? { ...record, [field]: value } : record
    ));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return `今日 (${date.toLocaleDateString('ja-JP')})`;
    if (diffDays === 2) return `昨日 (${date.toLocaleDateString('ja-JP')})`;
    return `${diffDays - 1}日前 (${date.toLocaleDateString('ja-JP')})`;
  };

  if (loading) return <div>読み込み中...</div>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        過去3日間の薬の記録
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {records.map((record, index) => (
          <Grid item xs={12} key={record.date}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {formatDate(record.date)}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={record.morning_taken}
                            onChange={(e) => handleRecordChange(record.date, 'morning_taken', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="朝の薬"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={record.afternoon_taken}
                            onChange={(e) => handleRecordChange(record.date, 'afternoon_taken', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="昼の薬"
                      />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={record.evening_taken}
                            onChange={(e) => handleRecordChange(record.date, 'evening_taken', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="夜の薬"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="備考"
                value={record.notes || ''}
                onChange={(e) => handleRecordChange(record.date, 'notes', e.target.value)}
                placeholder="体調や気づいたことがあれば記録してください"
                sx={{ mb: 2 }}
              />

              <Box textAlign="right">
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={() => updateRecord(record)}
                  color="primary"
                >
                  保存
                </Button>
              </Box>

              {index < records.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PastRecords;
