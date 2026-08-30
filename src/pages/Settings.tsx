import React, { useState, useRef, useEffect } from 'react';
import { useApp, useUnsavedChanges } from '../context/AppContext';
import { useAuth } from '../auth/AuthContext';
import api from '../utils/api';
import { ALL_PAGE_PERMISSIONS, ROLE_PERMISSIONS } from '../auth/permissions';
import type { UserRole, User } from '../types';
import { Modal } from '../components/Modal';
import { authService } from '../auth/authService';
import {
  Store,
  FileText,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Image as ImageIcon,
  CreditCard,
  Sliders,
  Eye,
  MapPin,
  Briefcase,
  Upload,
  Trash2,
  Users,
  UserPlus,
  ShieldAlert,
  KeyRound,
  Search,
  Edit2,
  UserCheck,
  UserX,
  AlertTriangle,
  HardDrive,
  Download,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Clock,
  RotateCcw,
  Flame,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getFullAddress, initialSettings, toTitleCase, getUserInitials } from '../utils/dummyData';

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const STATE_DISTRICTS: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan", "Kamrup Rural", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udepur", "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Mamba", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Waynad", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Hoshangabad (Narmadapuram)", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
  "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Noklak", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Baudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Bara Banki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
};



export const Settings: React.FC = () => {
  console.log('[Component Re-rendered] Settings');
  const { settings, updateSettings, setTheme, resetToDefault, showToast } = useApp();
  const { currentUser, currentCompany } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'banking' | 'branding' | 'prefixes' | 'system' | 'users' | 'backup' | 'erase'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Erase Business Data module states
  const [eraseSummaryData, setEraseSummaryData] = useState<any>(null);
  const [isLoadingEraseSummary, setIsLoadingEraseSummary] = useState(false);
  const [selectedEraseMode, setSelectedEraseMode] = useState<'temporary' | 'permanent'>('temporary');
  const [eraseConfirmText, setEraseConfirmText] = useState('');
  const [isExecutingErase, setIsExecutingErase] = useState(false);
  const [isUndoingErase, setIsUndoingErase] = useState(false);
  const [eraseErrorMsg, setEraseErrorMsg] = useState('');

  const fetchEraseSummary = async () => {
    setIsLoadingEraseSummary(true);
    try {
      const res = await api.get('/settings/erase/summary');
      if (res.data.success) {
        setEraseSummaryData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch erase summary:', err);
    } finally {
      setIsLoadingEraseSummary(false);
    }
  };

  const handleExecuteEraseMode = async () => {
    if (eraseConfirmText !== 'ERASE') {
      setEraseErrorMsg('You must type ERASE exactly to confirm erasure.');
      return;
    }

    setEraseErrorMsg('');
    setIsExecutingErase(true);

    try {
      const endpoint = selectedEraseMode === 'temporary' ? '/settings/erase/temporary' : '/settings/erase/permanent';
      const res = await api.post(endpoint, { confirmText: 'ERASE' });
      setIsExecutingErase(false);

      if (res.data.success) {
        if (showToast) showToast(res.data.message || 'Business data erased successfully.', 'success');
        setEraseConfirmText('');
        fetchEraseSummary();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setEraseErrorMsg(res.data.message || 'Erase operation failed.');
      }
    } catch (err: any) {
      setIsExecutingErase(false);
      setEraseErrorMsg(err.response?.data?.message || err.message || 'Erase operation failed safely. Existing data remains intact.');
    }
  };

  const handleUndoLastErase = async () => {
    setEraseErrorMsg('');
    setIsUndoingErase(true);

    try {
      const res = await api.post('/settings/erase/undo');
      setIsUndoingErase(false);

      if (res.data.success) {
        if (showToast) showToast('Previous business data restored successfully! Refreshing...', 'success');
        fetchEraseSummary();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setEraseErrorMsg(res.data.message || 'Undo operation failed.');
      }
    } catch (err: any) {
      setIsUndoingErase(false);
      setEraseErrorMsg(err.response?.data?.message || err.message || 'Undo operation failed safely.');
    }
  };

  // Backup & Restore module states
  const [lastBackupMeta, setLastBackupMeta] = useState<any>(null);
  const [lastRestoreMeta, setLastRestoreMeta] = useState<any>(null);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<any>(null);
  const [isValidatingBackup, setIsValidatingBackup] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    metadata?: any;
    dataSummary?: any;
    message?: string;
  } | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreErrorMsg, setRestoreErrorMsg] = useState('');

  // Phase 2 & Phase 3: Google Drive & Automatic Backup states
  const [gdriveStatus, setGdriveStatus] = useState<any>(null);
  const [backupHistoryData, setBackupHistoryData] = useState<any>(null);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isDisconnectingDrive, setIsDisconnectingDrive] = useState(false);
  const [isTriggeringBackupNow, setIsTriggeringBackupNow] = useState(false);

  // Phase 3: Health & Cloud Restore states
  const [backupHealth, setBackupHealth] = useState<any>(null);
  const [restoreSourceTab, setRestoreSourceTab] = useState<'device' | 'gdrive'>('device');
  const [cloudPreviewLoadingId, setCloudPreviewLoadingId] = useState<string | null>(null);
  const [cloudDownloadLoadingId, setCloudDownloadLoadingId] = useState<string | null>(null);
  const [selectedCloudHistory, setSelectedCloudHistory] = useState<any | null>(null);
  const [cloudValidationResult, setCloudValidationResult] = useState<any | null>(null);
  const [cloudConfirmInput, setCloudConfirmInput] = useState('');
  const [isRestoringCloud, setIsRestoringCloud] = useState(false);
  const [cloudRestoreErrorMsg, setCloudRestoreErrorMsg] = useState('');
  const [showManualBackupDetails, setShowManualBackupDetails] = useState(false);

  const fetchBackupHealth = async () => {
    try {
      const res = await api.get('/settings/backup/health');
      if (res.data.success) {
        setBackupHealth(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch backup health:', err);
    }
  };

  const handleCloudPreview = async (item: any) => {
    setCloudPreviewLoadingId(item.historyId);
    setCloudRestoreErrorMsg('');
    setCloudConfirmInput('');
    try {
      const res = await api.get(`/settings/backup/cloud/preview/${item.historyId}`);
      setCloudPreviewLoadingId(null);
      if (res.data.success && res.data.valid) {
        setSelectedCloudHistory(item);
        setCloudValidationResult(res.data);
        setRestoreSourceTab('gdrive');
        const element = document.getElementById('restore-section-card');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        if (showToast) showToast(res.data.message || 'Cloud backup validation failed.', 'error');
        fetchGoogleDriveAndHistory();
      }
    } catch (err: any) {
      setCloudPreviewLoadingId(null);
      const msg = err.response?.data?.message || err.message || 'Failed to preview cloud backup.';
      if (showToast) showToast(msg, 'error');
      fetchGoogleDriveAndHistory();
    }
  };

  const handleCloudDownload = async (item: any) => {
    setCloudDownloadLoadingId(item.historyId);
    try {
      const res = await api.get(`/settings/backup/cloud/download/${item.historyId}`, { responseType: 'blob' });
      const filename = item.fileName || `agribiz-cloud-backup-${item.historyId}.json`;
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      if (showToast) showToast('Cloud backup downloaded successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to download cloud backup file.';
      if (showToast) showToast(msg, 'error');
      fetchGoogleDriveAndHistory();
    } finally {
      setCloudDownloadLoadingId(null);
    }
  };

  const handleExecuteCloudRestore = async () => {
    if (!selectedCloudHistory) return;
    if (cloudConfirmInput !== 'RESTORE') {
      setCloudRestoreErrorMsg('You must type RESTORE exactly to confirm data restoration.');
      return;
    }

    setCloudRestoreErrorMsg('');
    setIsRestoringCloud(true);

    try {
      const res = await api.post(`/settings/backup/cloud/restore/${selectedCloudHistory.historyId}`, {
        confirmText: 'RESTORE',
      });
      setIsRestoringCloud(false);

      if (res.data.success) {
        if (showToast) showToast('Company data restored cleanly from Google Drive! Refreshing...', 'success');
        setSelectedCloudHistory(null);
        setCloudValidationResult(null);
        setCloudConfirmInput('');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setCloudRestoreErrorMsg(res.data.message || 'Cloud restoration failed.');
      }
    } catch (err: any) {
      setIsRestoringCloud(false);
      setCloudRestoreErrorMsg(err.response?.data?.message || err.message || 'Cloud data restoration failed safely. Current data remains intact.');
    }
  };

  const fetchGoogleDriveAndHistory = async () => {
    try {
      const res = await api.get('/settings/backup/history');
      if (res.data.success) {
        setGdriveStatus(res.data.driveStatus);
        setBackupHistoryData({
          lastSuccessfulBackup: res.data.lastSuccessfulBackup,
          latestAttempt: res.data.latestAttempt,
          historyList: res.data.historyList || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch backup history:', err);
    }
  };

  const handleConnectGoogleDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const res = await api.get('/settings/backup/google/auth-url');
      setIsConnectingDrive(false);
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      setIsConnectingDrive(false);
      if (showToast) showToast(err.response?.data?.message || err.message || 'Failed to generate Google auth link.', 'error');
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    setIsDisconnectingDrive(true);
    try {
      const res = await api.post('/settings/backup/google/disconnect');
      setIsDisconnectingDrive(false);
      if (res.data.success) {
        if (showToast) showToast(res.data.message || 'Google Drive disconnected.', 'info');
        fetchGoogleDriveAndHistory();
      }
    } catch (err: any) {
      setIsDisconnectingDrive(false);
      if (showToast) showToast(err.response?.data?.message || err.message || 'Failed to disconnect Google Drive.', 'error');
    }
  };

  const handleBackupNow = async () => {
    setIsTriggeringBackupNow(true);
    try {
      const res = await api.post('/settings/backup/google/trigger');
      setIsTriggeringBackupNow(false);
      if (res.data.success) {
        if (showToast) showToast('Backup successfully generated and verified on Google Drive!', 'success');
        fetchGoogleDriveAndHistory();
        fetchLastBackupInfo();
      } else {
        if (showToast) showToast(res.data.message || 'Backup pipeline failed.', 'error');
        fetchGoogleDriveAndHistory();
      }
    } catch (err: any) {
      setIsTriggeringBackupNow(false);
      if (showToast) showToast(err.response?.data?.message || err.message || 'Manual Google Drive backup failed.', 'error');
      fetchGoogleDriveAndHistory();
    }
  };

  const fetchLastBackupInfo = async () => {
    try {
      const res = await api.get('/settings/backup/last');
      if (res.data.success) {
        setLastBackupMeta(res.data.lastBackupMetadata);
        setLastRestoreMeta(res.data.lastRestoreMetadata);
      }
    } catch (err) {
      console.error('Failed to fetch last backup info:', err);
    }
  };

  const handleCreateBackup = async () => {
    setIsExportingBackup(true);
    try {
      const res = await api.get('/settings/backup/export', { responseType: 'blob' });
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `agribiz-backup-${currentCompany?.id || 'company'}-${dateStr}.json`;
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      if (showToast) showToast('Backup created and downloaded successfully!', 'success');
      fetchLastBackupInfo();
    } catch (err: any) {
      if (showToast) showToast(err.response?.data?.message || 'Failed to generate backup file.', 'error');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedBackupFile(file);
    setValidationResult(null);
    setParsedBackupData(null);
    setRestoreErrorMsg('');
    setRestoreConfirmText('');

    if (!file.name.toLowerCase().endsWith('.json')) {
      setValidationResult({
        valid: false,
        message: 'Invalid file format: Backup file must be a .json file.',
      });
      return;
    }

    setIsValidatingBackup(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        setParsedBackupData(parsed);

        const res = await api.post('/settings/backup/validate', parsed);
        setIsValidatingBackup(false);
        if (res.data.success && res.data.valid) {
          setValidationResult({
            valid: true,
            metadata: res.data.metadata,
            dataSummary: res.data.dataSummary,
          });
        } else {
          setValidationResult({
            valid: false,
            message: res.data.message || 'Backup file validation failed.',
          });
        }
      } catch (err: any) {
        setIsValidatingBackup(false);
        setValidationResult({
          valid: false,
          message: err.response?.data?.message || 'Corrupted or malformed JSON backup file.',
        });
      }
    };
    reader.onerror = () => {
      setIsValidatingBackup(false);
      setValidationResult({
        valid: false,
        message: 'Failed to read the selected backup file.',
      });
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (restoreConfirmText !== 'RESTORE') {
      setRestoreErrorMsg('You must type RESTORE exactly to confirm data restoration.');
      return;
    }
    if (!parsedBackupData || !validationResult?.valid) {
      setRestoreErrorMsg('No valid backup payload available to restore.');
      return;
    }

    setRestoreErrorMsg('');
    setIsRestoring(true);

    try {
      const res = await api.post('/settings/backup/restore', {
        backupPayload: parsedBackupData,
        confirmText: 'RESTORE',
      });
      setIsRestoring(false);

      if (res.data.success) {
        if (showToast) showToast('Company data restored successfully! Refreshing...', 'success');
        setSelectedBackupFile(null);
        setParsedBackupData(null);
        setValidationResult(null);
        setRestoreConfirmText('');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setRestoreErrorMsg(res.data.message || 'Restoration failed.');
      }
    } catch (err: any) {
      setIsRestoring(false);
      setRestoreErrorMsg(err.response?.data?.message || err.message || 'Data restoration failed safely. Previous company data remains intact.');
    }
  };

  useEffect(() => {
    if (activeTab === 'backup' && currentCompany) {
      fetchLastBackupInfo();
      fetchGoogleDriveAndHistory();
      fetchBackupHealth();
    }
    if (activeTab === 'erase' && currentCompany) {
      fetchEraseSummary();
    }
  }, [activeTab, currentCompany]);

  const settingsTabsRef = useRef<HTMLDivElement>(null);

  // Center active settings tab item when activeTab changes without scrolling window vertically
  useEffect(() => {
    if (settingsTabsRef.current) {
      const activeTabElement = settingsTabsRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeTabElement) {
        const container = settingsTabsRef.current;
        const containerRect = container.getBoundingClientRect();
        const childRect = activeTabElement.getBoundingClientRect();
        const scrollOffset = childRect.left - containerRect.left - (containerRect.width / 2) + (childRect.width / 2);
        container.scrollBy({ left: scrollOffset, behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | UserRole>('All');
  const [userStatusFilter, setUserStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Employee Modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingStaffUser, setEditingStaffUser] = useState<User | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffMobile, setStaffMobile] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Accounts');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffCustomPermissions, setStaffCustomPermissions] = useState<string[]>([]);

  // Password reset modal state
  const [resetStaffUser, setResetStaffUser] = useState<User | null>(null);
  const [newResetPass, setNewResetPass] = useState('');
  const [newResetPin, setNewResetPin] = useState('');

  // Delete Business Account Modal state
  const [isDeleteCompanyModalOpen, setIsDeleteCompanyModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePasswordOrPin, setDeletePasswordOrPin] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');

  const handleDeleteBusinessAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      setDeleteErrorMsg('You must type DELETE exactly to confirm.');
      return;
    }
    if (!deletePasswordOrPin.trim()) {
      setDeleteErrorMsg('Please enter your Owner Password or 4-digit PIN.');
      return;
    }

    setDeleteErrorMsg('');
    setDeleteLoading(true);

    try {
      const res = await authService.deleteBusinessAccount(deleteConfirmText, deletePasswordOrPin.trim());
      setDeleteLoading(false);
      if (res.success) {
        setIsDeleteCompanyModalOpen(false);
        showToast('Business account permanently deleted.', 'info');
        window.location.href = '/';
      } else {
        setDeleteErrorMsg(res.message);
      }
    } catch (err: any) {
      setDeleteLoading(false);
      setDeleteErrorMsg(err.message || 'Deletion failed. Please try again.');
    }
  };

  const refreshUsersList = async () => {
    if (!currentCompany) return;
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsersList(res.data.users);
      }
    } catch (err: any) {
      console.error('Failed to load staff users:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && currentCompany) {
      refreshUsersList();
    }
  }, [activeTab, currentCompany]);

  useEffect(() => {
    const handleStaffListChanged = () => {
      if (activeTab === 'users') {
        refreshUsersList();
      }
    };

    const handlePresenceChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && (detail.userId || detail.record)) {
        const targetId = String(detail.userId || detail.record?.id || detail.record?.userId || '').trim();
        const targetMobile = detail.record?.mobile ? String(detail.record.mobile).trim() : null;
        const newStatus = detail.presenceStatus || detail.record?.presenceStatus;

        if (!newStatus) return;

        setUsersList(prev => prev.map(u => {
          const uId = String(u.id || (u as any).userId || (u as any)._id || '').trim();
          const uMobile = u.mobile ? String(u.mobile).trim() : null;

          if ((targetId && uId === targetId) || (targetMobile && uMobile && uMobile === targetMobile)) {
            return { ...u, presenceStatus: newStatus };
          }
          return u;
        }));
      }
    };

    window.addEventListener('staff-list-changed', handleStaffListChanged);
    window.addEventListener('staff-presence-changed', handlePresenceChanged);

    return () => {
      window.removeEventListener('staff-list-changed', handleStaffListChanged);
      window.removeEventListener('staff-presence-changed', handlePresenceChanged);
    };
  }, [activeTab, currentCompany]);

  const handleStaffRoleChange = (newRole: UserRole) => {
    setStaffRole(newRole);
    if (newRole === 'Owner') {
      setStaffCustomPermissions(['*']);
    } else {
      setStaffCustomPermissions([...(ROLE_PERMISSIONS[newRole] || [])]);
    }
  };

  const handleSaveStaffUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    const finalPermissions = staffRole === 'Owner' ? ['*'] : staffCustomPermissions;

    try {
      if (editingStaffUser) {
        const payload: any = {
          name: staffName.trim(),
          role: staffRole,
          email: staffEmail.trim() || undefined,
          customPermissions: finalPermissions,
        };
        if (staffPassword.trim()) {
          payload.password = staffPassword.trim();
        }
        if (staffPin.trim()) {
          if (!/^\d{4}$/.test(staffPin.trim())) {
            showToast('PIN must be exactly 4 digits.', 'error');
            return;
          }
          payload.pin = staffPin.trim();
        }
        const res = await api.put(`/users/${editingStaffUser.id}`, payload);
        if (res.data.success) {
          showToast(`Staff member ${payload.name} details & permissions updated!`, 'success');
        }
      } else {
        if (!staffName || !staffPin) {
          showToast('Please enter Staff Name and 4-digit PIN.', 'error');
          return;
        }
        if (!/^\d{4}$/.test(staffPin.trim())) {
          showToast('Security PIN must be exactly 4 numeric digits.', 'error');
          return;
        }
        const payload: any = {
          id: `USR-${staffRole.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`,
          name: staffName.trim(),
          mobile: staffMobile.replace(/\D/g, '') || undefined,
          pin: staffPin.trim(),
          role: staffRole,
          email: staffEmail.trim() || undefined,
          customPermissions: finalPermissions,
        };
        const res = await api.post('/users', payload);
        if (res.data.success) {
          showToast(`Staff member ${payload.name} added successfully as ${payload.role}!`, 'success');
        }
      }

      setIsAddUserModalOpen(false);
      setEditingStaffUser(null);
      setStaffName('');
      setStaffMobile('');
      setStaffPassword('');
      setStaffPin('');
      setStaffRole('Accounts');
      setStaffEmail('');
      setStaffCustomPermissions([]);
      refreshUsersList();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Operation failed. Please try again.', 'error');
    }
  };

  const handleToggleUserStatus = async (u: User) => {
    if (u.role === 'Owner') {
      showToast('The Owner account is the primary administrator and cannot be disabled.', 'info');
      return;
    }
    const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await api.put(`/users/${u.id}`, { status: newStatus });
      if (res.data.success) {
        showToast(`${u.name} status set to ${newStatus}`, 'info');
        refreshUsersList();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user status.', 'error');
    }
  };

  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaffUser) return;

    if (resetStaffUser.role === 'Owner') {
      if (!newResetPass.trim() && !newResetPin.trim()) {
        showToast('Please enter a new password or a new 4-digit PIN to reset.', 'error');
        return;
      }
      if (newResetPass.trim() && newResetPass.trim().length < 6) {
        showToast('Password must be at least 6 characters long.', 'error');
        return;
      }
      if (newResetPin.trim() && !/^\d{4}$/.test(newResetPin.trim())) {
        showToast('PIN must be exactly 4 numeric digits.', 'error');
        return;
      }
      try {
        const payload: any = {};
        if (newResetPass.trim()) payload.password = newResetPass.trim();
        if (newResetPin.trim()) payload.pin = newResetPin.trim();

        const res = await api.put(`/users/${resetStaffUser.id}`, payload);
        if (res.data.success) {
          showToast(`Owner credentials updated successfully for ${resetStaffUser.name}!`, 'success');
          setResetStaffUser(null);
          setNewResetPass('');
          setNewResetPin('');
          refreshUsersList();
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to update credentials.', 'error');
      }
    } else {
      if (!newResetPin.trim() || !/^\d{4}$/.test(newResetPin.trim())) {
        showToast('Security PIN must be exactly 4 numeric digits.', 'error');
        return;
      }
      try {
        const res = await api.put(`/users/${resetStaffUser.id}`, { pin: newResetPin.trim() });
        if (res.data.success) {
          showToast(`Security PIN for ${resetStaffUser.name} reset successfully!`, 'success');
          setResetStaffUser(null);
          setNewResetPin('');
          refreshUsersList();
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to reset PIN.', 'error');
      }
    }
  };

  // Business Information
  const [businessName, setBusinessName] = useState(settings.businessName || '');
  const [ownerName, setOwnerName] = useState(settings.ownerName || '');
  const [gstin, setGstin] = useState(settings.gstin || '');
  const [panNumber, setPanNumber] = useState(settings.panNumber || '');
  const [businessType, setBusinessType] = useState(settings.businessType || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(settings.alternatePhone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [website, setWebsite] = useState(settings.website || '');

  // Business Address
  const [addressLine1, setAddressLine1] = useState(settings.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(settings.addressLine2 || '');
  const [city, setCity] = useState(settings.city || '');
  const [taluka, setTaluka] = useState(settings.taluka || '');
  const [district, setDistrict] = useState(settings.district || '');
  const [state, setState] = useState(settings.state || '');
  const [pincode, setPincode] = useState(settings.pincode || '');

  // Business Address dependent selection states
  const [selectedState, setSelectedState] = useState(() => {
    return INDIAN_STATES.includes(settings.state || '') ? (settings.state || '') : (settings.state ? 'custom' : '');
  });
  const [customState, setCustomState] = useState(() => {
    return INDIAN_STATES.includes(settings.state || '') ? '' : (settings.state || '');
  });

  const getDistrictOptions = (st: string) => {
    return STATE_DISTRICTS[st] || [];
  };

  const [selectedDistrict, setSelectedDistrict] = useState(() => {
    const opts = getDistrictOptions(settings.state || '');
    return opts.includes(settings.district || '') ? (settings.district || '') : (settings.district ? 'custom' : '');
  });
  const [customDistrict, setCustomDistrict] = useState(() => {
    const opts = getDistrictOptions(settings.state || '');
    return opts.includes(settings.district || '') ? '' : (settings.district || '');
  });

  const handleStateChange = (newVal: string) => {
    setSelectedState(newVal);
    if (newVal && newVal !== 'custom') {
      setState(newVal);
      setCustomState('');
    } else {
      setState('');
      setCustomState('');
    }
    
    // Reset district states
    setSelectedDistrict('');
    setCustomDistrict('');
    setDistrict('');
  };

  const handleDistrictChange = (newVal: string) => {
    setSelectedDistrict(newVal);
    if (newVal && newVal !== 'custom') {
      setDistrict(newVal);
      setCustomDistrict('');
    } else {
      setDistrict('');
      setCustomDistrict('');
    }
  };

  // Branding
  const [logo, setLogo] = useState(settings.logo || '');
  const [watermarkLogo, setWatermarkLogo] = useState(settings.watermarkLogo || '');
  const [savedSignature, setSavedSignature] = useState(settings.signature || '');
  const [isPadEditing, setIsPadEditing] = useState(false);
  const isDrawingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Banking Details
  const [bankName, setBankName] = useState(settings.bankName || '');
  const [accountHolderName, setAccountHolderName] = useState(settings.accountHolderName || '');
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(settings.ifscCode || '');
  const [branchName, setBranchName] = useState(settings.branchName || '');
  const [upiId, setUpiId] = useState(settings.upiId || '');

  // Invoice Configuration
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || '');
  const [purchasePrefix, setPurchasePrefix] = useState(settings.purchasePrefix || '');
  const [quotationPrefix, setQuotationPrefix] = useState(settings.quotationPrefix || '');
  const [financialYear, setFinancialYear] = useState(settings.financialYear || '');
  const [defaultTerms, _setDefaultTerms] = useState(settings.defaultTerms || '');
  const [invoiceTerms, setInvoiceTerms] = useState(settings.invoiceTerms || initialSettings.invoiceTerms || '');
  const [quotationTerms, setQuotationTerms] = useState(settings.quotationTerms || initialSettings.quotationTerms || '');
  const [purchaseTerms, setPurchaseTerms] = useState(settings.purchaseTerms || initialSettings.purchaseTerms || '');
  const [footerMessage, setFooterMessage] = useState(settings.footerMessage || '');

  // Print Preferences
  const [showLogo, setShowLogo] = useState(settings.showLogo ?? true);
  const [showGstin, setShowGstin] = useState(settings.showGstin ?? true);
  const [showAddress, setShowAddress] = useState(settings.showAddress ?? true);
  const [showContact, setShowContact] = useState(settings.showContact ?? true);
  const [showBankDetails, setShowBankDetails] = useState(settings.showBankDetails ?? true);
  const [showTerms, setShowTerms] = useState(settings.showTerms ?? true);

  // Application Preferences
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'DD/MM/YYYY');
  const [showLowStockAlert, setShowLowStockAlert] = useState(settings.showLowStockAlert !== false);
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(settings.showOutOfStockAlert !== false);

  const currentFormValues = {
    businessName,
    ownerName,
    gstin,
    panNumber,
    businessType,
    phone,
    alternatePhone,
    email,
    website,
    addressLine1,
    addressLine2,
    city,
    taluka,
    district,
    state,
    pincode,
    logo,
    watermarkLogo,
    savedSignature,
    bankName,
    accountHolderName,
    accountNumber,
    ifscCode,
    branchName,
    upiId,
    invoicePrefix,
    purchasePrefix,
    quotationPrefix,
    financialYear,
    invoiceTerms,
    quotationTerms,
    purchaseTerms,
    footerMessage,
    showLogo,
    showGstin,
    showAddress,
    showContact,
    showBankDetails,
    showTerms,
    currencySymbol,
    dateFormat,
    showLowStockAlert,
    showOutOfStockAlert,
  };

  const initialFormValues = {
    businessName: settings.businessName || '',
    ownerName: settings.ownerName || '',
    gstin: settings.gstin || '',
    panNumber: settings.panNumber || '',
    businessType: settings.businessType || '',
    phone: settings.phone || '',
    alternatePhone: settings.alternatePhone || '',
    email: settings.email || '',
    website: settings.website || '',
    addressLine1: settings.addressLine1 || '',
    addressLine2: settings.addressLine2 || '',
    city: settings.city || '',
    taluka: settings.taluka || '',
    district: settings.district || '',
    state: settings.state || '',
    pincode: settings.pincode || '',
    logo: settings.logo || '',
    watermarkLogo: settings.watermarkLogo || '',
    savedSignature: settings.signature || '',
    bankName: settings.bankName || '',
    accountHolderName: settings.accountHolderName || '',
    accountNumber: settings.accountNumber || '',
    ifscCode: settings.ifscCode || '',
    branchName: settings.branchName || '',
    upiId: settings.upiId || '',
    invoicePrefix: settings.invoicePrefix || '',
    purchasePrefix: settings.purchasePrefix || '',
    quotationPrefix: settings.quotationPrefix || '',
    financialYear: settings.financialYear || '',
    invoiceTerms: settings.invoiceTerms || initialSettings.invoiceTerms || '',
    quotationTerms: settings.quotationTerms || initialSettings.quotationTerms || '',
    purchaseTerms: settings.purchaseTerms || initialSettings.purchaseTerms || '',
    footerMessage: settings.footerMessage || '',
    showLogo: settings.showLogo ?? true,
    showGstin: settings.showGstin ?? true,
    showAddress: settings.showAddress ?? true,
    showContact: settings.showContact ?? true,
    showBankDetails: settings.showBankDetails ?? true,
    showTerms: settings.showTerms ?? true,
    currencySymbol: settings.currencySymbol || '₹',
    dateFormat: settings.dateFormat || 'DD/MM/YYYY',
    showLowStockAlert: settings.showLowStockAlert !== false,
    showOutOfStockAlert: settings.showOutOfStockAlert !== false,
  };

  useUnsavedChanges('settings-form', currentFormValues, initialFormValues);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedBusinessName = toTitleCase(businessName);
    const formattedOwnerName = toTitleCase(ownerName);
    const formattedGSTIN = gstin.toUpperCase();
    const formattedPAN = panNumber.toUpperCase();
    const formattedIFSC = ifscCode.toUpperCase();

    // Update local state to match formatted context values
    setBusinessName(formattedBusinessName);
    setOwnerName(formattedOwnerName);
    setGstin(formattedGSTIN);
    setPanNumber(formattedPAN);
    setIfscCode(formattedIFSC);

    // Dynamically derive standard legacy address
    const legacyAddress = getFullAddress({
      addressLine1,
      addressLine2,
      city,
      taluka,
      district,
      state,
      pincode
    });

    updateSettings({
      businessName: formattedBusinessName,
      ownerName: formattedOwnerName,
      gstin: formattedGSTIN,
      panNumber: formattedPAN,
      businessType,
      phone,
      alternatePhone,
      email,
      website,
      addressLine1,
      addressLine2,
      city,
      taluka,
      district,
      state,
      pincode,
      logo,
      watermarkLogo,
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode: formattedIFSC,
      branchName,
      upiId,
      invoicePrefix,
      purchasePrefix,
      quotationPrefix,
      financialYear,
      defaultTerms,
      invoiceTerms,
      quotationTerms,
      purchaseTerms,
      footerMessage,
      showLogo,
      showGstin,
      showAddress,
      showContact,
      showBankDetails,
      showTerms,
      currencySymbol,
      dateFormat,
      showLowStockAlert,
      showOutOfStockAlert,
      theme: settings.theme,
      address: legacyAddress,
      signature: savedSignature,
    });

    setSavedSuccess(true);
    if (showToast) {
      showToast('Preferences saved successfully!');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('Selected logo size exceeds 1.5MB limit. Please upload a smaller compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo('');
  };

  const handleWatermarkLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('Selected watermark logo size exceeds 1.5MB limit. Please upload a smaller compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setWatermarkLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveWatermarkLogo = () => {
    setWatermarkLogo('');
  };

  const initSignatureCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width || canvas.offsetWidth || 500);
      const h = Math.round(rect.height || canvas.offsetHeight || 140);
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Synchronously size signature canvas on mount or tab switch so cursor drawing is 100% smooth
  useEffect(() => {
    if (activeTab === 'branding' && (!savedSignature || isPadEditing)) {
      const timer = setTimeout(initSignatureCanvas, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, savedSignature, isPadEditing]);

  // Global mouseup / touchend listener to guarantee mouse cursor release is caught anywhere
  useEffect(() => {
    const handleGlobalRelease = () => {
      isDrawingRef.current = false;
    };
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
    };
  }, []);

  const getEventCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    if ('pointerId' in e && canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width === 0 || canvas.height === 0) {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width || canvas.offsetWidth || 500);
      canvas.height = Math.round(rect.height || canvas.offsetHeight || 140);
    }

    const coords = getEventCoords(e, canvas);
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1E3A8A'; // Professional dark blue ink
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    isDrawingRef.current = true;
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (
    e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (e && 'pointerId' in e && canvasRef.current) {
      try {
        if (canvasRef.current.hasPointerCapture(e.pointerId)) {
          canvasRef.current.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    }
  };

  const clearSignaturePad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    // Scan all pixels to find the bounding box of non-transparent pixels (alpha > 0)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) {
      return canvas;
    }

    // Add 5px padding around the cropped signature area
    const padding = 5;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropWidth = Math.min(width - cropX, (maxX - minX) + (padding * 2));
    const cropHeight = Math.min(height - cropY, (maxY - minY) + (padding * 2));

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = cropWidth;
    trimmedCanvas.height = cropHeight;
    const trimmedCtx = trimmedCanvas.getContext('2d');
    if (!trimmedCtx) return canvas;

    trimmedCtx.drawImage(
      canvas,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    return trimmedCanvas;
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Automatically crop transparent boundaries
    const trimmedCanvas = trimCanvas(canvas);
    const base64Data = trimmedCanvas.toDataURL('image/png');
    setSavedSignature(base64Data);
    setIsPadEditing(false);
    updateSettings({
      ...settings,
      signature: base64Data
    });
    if (showToast) {
      showToast('Signature saved successfully!');
    }
  };

  const handleRemoveSignature = () => {
    setSavedSignature('');
    setIsPadEditing(true);
    updateSettings({
      ...settings,
      signature: undefined
    });
    if (showToast) {
      showToast('Signature removed successfully!');
    }
  };

  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('Selected signature image size exceeds 1.5MB limit. Please upload a smaller compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      setSavedSignature(base64Data);
      updateSettings({
        ...settings,
        signature: base64Data
      });
      if (showToast) {
        showToast('Signature image uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    if (confirm('WARNING: Wiping database will delete all sales invoices, purchases, payments, and custom customer profiles. This resets AgriBiz to original sample data. Proceed?')) {
      resetToDefault();
      alert('AgriBiz database reset to initial mock states successfully.');
      window.location.reload();
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme);
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }} className="no-print">
      {/* Modern Inner Navigation Tabs */}
      <div className="settings-tabs-horizontal" ref={settingsTabsRef}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`settings-tab-pill ${activeTab === 'profile' ? 'active' : ''}`}
          data-active={activeTab === 'profile'}
        >
          <Store size={15} /> Business Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('banking')}
          className={`settings-tab-pill ${activeTab === 'banking' ? 'active' : ''}`}
          data-active={activeTab === 'banking'}
        >
          <CreditCard size={15} /> Bank Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`settings-tab-pill ${activeTab === 'branding' ? 'active' : ''}`}
          data-active={activeTab === 'branding'}
        >
          <ImageIcon size={15} /> Logos & Signature
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prefixes')}
          className={`settings-tab-pill ${activeTab === 'prefixes' ? 'active' : ''}`}
          data-active={activeTab === 'prefixes'}
        >
          <FileText size={15} /> Vouchers & Terms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`settings-tab-pill ${activeTab === 'system' ? 'active' : ''}`}
          data-active={activeTab === 'system'}
        >
          <Sliders size={15} /> Print & System
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`settings-tab-pill ${activeTab === 'users' ? 'active' : ''}`}
          data-active={activeTab === 'users'}
        >
          <Users size={15} /> Staff & Roles
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`settings-tab-pill ${activeTab === 'backup' ? 'active' : ''}`}
          data-active={activeTab === 'backup'}
        >
          <HardDrive size={15} /> Backup & Restore
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('erase')}
          className={`settings-tab-pill ${activeTab === 'erase' ? 'active' : ''}`}
          data-active={activeTab === 'erase'}
          style={activeTab === 'erase' ? { backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#dc2626' } : undefined}
        >
          <Trash2 size={15} /> Erase Business Data
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: Business Profile & Address */}
          {activeTab === 'profile' && (
            <>
              {/* Business Info */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Business Information</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Manage firm names, PAN/GST registration, and contacts</p>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Firm / Business Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Owner Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">GST Number (GSTIN) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      maxLength={15}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PAN Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Proprietorship, Partnership"
                      className="form-control"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Primary Phone *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alternate Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      type="text"
                      placeholder="e.g. www.agribizstore.com"
                      className="form-control"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Business Address</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Set physical store billing addresses</p>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Address Line 1 *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address Line 2</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <select
                      className="form-control"
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                      required
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                      <option value="custom">-- Enter Manually --</option>
                    </select>
                    {selectedState === 'custom' && (
                      <input
                        type="text"
                        placeholder="Enter State Name"
                        className="form-control"
                        style={{ marginTop: '8px' }}
                        value={customState}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCustomState(v);
                          setState(v);
                        }}
                        required
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <select
                      className="form-control"
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      required
                    >
                      <option value="">Select District</option>
                      {getDistrictOptions(state).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value="custom">-- Enter Manually --</option>
                    </select>
                    {selectedDistrict === 'custom' && (
                      <input
                        type="text"
                        placeholder="Enter District Name"
                        className="form-control"
                        style={{ marginTop: '8px' }}
                        value={customDistrict}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCustomDistrict(v);
                          setDistrict(v);
                        }}
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Taluka (Tehsil)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={taluka}
                      placeholder="e.g. Pipariya"
                      onChange={(e) => setTaluka(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Village / City *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={city}
                      placeholder="e.g. Pipariya"
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Danger Zone: Delete Business Account (Owner only) */}
              {currentUser?.role === 'Owner' && (
                <div style={{
                  marginTop: '28px',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1.5px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <AlertTriangle size={18} style={{ color: '#EF4444' }} />
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#EF4444' }}>
                        Danger Zone — Delete Business Account
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary,#475569)', lineHeight: '1.5' }}>
                      Permanently delete this business account, all staff members, inventory, invoices, reports, customers, and all MongoDB records. <strong>This action cannot be undone.</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary danger"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setDeletePasswordOrPin('');
                      setDeleteErrorMsg('');
                      setIsDeleteCompanyModalOpen(true);
                    }}
                    style={{
                      borderRadius: '12px',
                      padding: '10px 20px',
                      fontWeight: 800,
                      fontSize: '13px',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} /> Delete Business Account
                  </button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: Bank Details */}
          {activeTab === 'banking' && (
            <div className="card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Banking & Settlement Details</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Manage bank account and UPI settlement options</p>
                </div>
              </div>

              <div className="form-grid-2" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Holder Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">IFSC Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    maxLength={11}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">UPI ID (for quick payments)</label>
                <input
                  type="text"
                  placeholder="e.g. storename@ybl"
                  className="form-control"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Logos & Signature Branding */}
          {activeTab === 'branding' && (
            <>
              {/* Company Logo Card */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Company Logo Branding</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Configure invoice logo brandings</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '20px' }}>
                  {logo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ border: '2px dashed var(--border-color)', padding: '10px', borderRadius: '14px', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                        <img src={logo} alt="Custom Branding Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>✓ Custom Business Logo Active</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                          <Upload size={14} /> Change Logo
                          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                        </label>
                        <button type="button" onClick={handleRemoveLogo} className="btn btn-danger btn-sm">
                          <Trash2 size={14} /> Remove Logo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '2px dashed var(--border-color)', padding: '24px', borderRadius: '16px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', backgroundColor: 'var(--bg-app)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '84px', height: '84px', borderRadius: '18px',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                          boxShadow: '0 6px 16px rgba(16, 185, 129, 0.12)'
                        }}>
                          <Store size={44} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Default Business Logo (Visual Fallback)
                        </span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Upload Custom Business Logo</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>PNG, JPG, or SVG format up to 1.5MB</div>
                      </div>
                      <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                        <Upload size={14} /> Choose Image File
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Watermark Logo Branding Card */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Dedicated Bill Watermark Logo</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Configure transparent bill background watermarks</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '20px' }}>
                  {watermarkLogo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ border: '2px dashed var(--border-color)', padding: '10px', borderRadius: '12px', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
                        <img src={watermarkLogo} alt="Watermark Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                          <Upload size={14} /> Change Watermark
                          <input type="file" accept="image/*" onChange={handleWatermarkLogoUpload} style={{ display: 'none' }} />
                        </label>
                        <button type="button" onClick={handleRemoveWatermarkLogo} className="btn btn-danger btn-sm">
                          <Trash2 size={14} /> Remove Watermark
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '16px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <ImageIcon size={40} style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Upload Bill Watermark Logo</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG, or SVG format up to 1.5MB (Defaults to Company Logo if empty)</div>
                      </div>
                      <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                        <Upload size={14} /> Choose Image File
                        <input type="file" accept="image/*" onChange={handleWatermarkLogoUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* E-Signature Drawing Card */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Authorized Signatory E-Signature</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Draw or manage electronic signature for invoices</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                  {savedSignature && !isPadEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                      <div style={{ border: '2px dashed var(--border-color)', padding: '12px 24px', borderRadius: '14px', width: '280px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                        <img src={savedSignature} alt="E-Signature Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>✓ Authorized Signatory E-Signature Active</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPadEditing(true);
                            setTimeout(initSignatureCanvas, 50);
                          }}
                          className="btn btn-primary btn-sm"
                        >
                          <Edit2 size={14} /> Draw / Re-sign with Cursor
                        </button>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                          <Upload size={14} /> Upload Image
                          <input type="file" accept="image/*" onChange={handleSignatureFileUpload} style={{ display: 'none' }} />
                        </label>
                        <button type="button" onClick={handleRemoveSignature} className="btn btn-danger btn-sm">
                          <Trash2 size={14} /> Remove Signature
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Press and drag your mouse cursor inside the box below to sign like in MS Paint:
                        </span>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                          <Upload size={14} /> Upload Signature Image
                          <input type="file" accept="image/*" onChange={handleSignatureFileUpload} style={{ display: 'none' }} />
                        </label>
                      </div>
                      <div style={{ position: 'relative', border: '2px dashed #0284c7', borderRadius: '14px', backgroundColor: '#ffffff', overflow: 'hidden', height: '150px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03)' }}>
                        <canvas
                          ref={canvasRef}
                          onPointerDown={startDrawing}
                          onPointerMove={draw}
                          onPointerUp={stopDrawing}
                          onPointerCancel={stopDrawing}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {savedSignature && (
                          <button type="button" onClick={() => setIsPadEditing(false)} className="btn btn-secondary btn-sm" style={{ marginRight: 'auto' }}>
                            Cancel
                          </button>
                        )}
                        <button type="button" onClick={clearSignaturePad} className="btn btn-secondary btn-sm">
                          Clear Pad
                        </button>
                        <button type="button" onClick={handleSaveSignature} className="btn btn-primary btn-sm">
                          Save Drawn Signature
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 4: Vouchers & Terms */}
          {activeTab === 'prefixes' && (
            <>
              {/* Accounting & Invoice Configurations */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Voucher & Document Prefixes</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Configure voucher prefix naming conventions</p>
                  </div>
                </div>

                <div className="form-grid-3" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Invoice Prefix *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Prefix *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={purchasePrefix}
                      onChange={(e) => setPurchasePrefix(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Quotation Prefix *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={quotationPrefix}
                      onChange={(e) => setQuotationPrefix(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Financial Year (F.Y.) *</label>
                    <select
                      className="form-control"
                      value={financialYear}
                      onChange={(e) => setFinancialYear(e.target.value)}
                    >
                      <option value="2025-2026">2025 - 2026</option>
                      <option value="2026-2027">2026 - 2027</option>
                      <option value="2027-2028">2027 - 2028</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Invoice Footer Message</label>
                  <input
                    type="text"
                    className="form-control"
                    value={footerMessage}
                    onChange={(e) => setFooterMessage(e.target.value)}
                    placeholder="Thank you for your business!"
                  />
                </div>
              </div>

              {/* Bill-Type Specific Terms & Conditions */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Terms & Conditions (per Bill Type)</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Customize default terms for invoices, quotations, and bills</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>📄 Sales Invoice Terms</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={invoiceTerms}
                      onChange={(e) => setInvoiceTerms(e.target.value)}
                      placeholder="e.g. Goods once sold will not be taken back. Warranty as per manufacturer terms."
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>📋 Quotation / Estimate Terms</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={quotationTerms}
                      onChange={(e) => setQuotationTerms(e.target.value)}
                      placeholder="e.g. This quotation is valid for 15 days. Prices are subject to change without notice."
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>🧾 Purchase Bill Terms</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={purchaseTerms}
                      onChange={(e) => setPurchaseTerms(e.target.value)}
                      placeholder="e.g. Payment due within 30 days. Goods received in good condition."
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                  These terms will automatically appear on their respective bill printouts.
                </div>
              </div>
            </>
          )}

          {/* TAB 5: Print Preferences & System Defaults */}
          {activeTab === 'system' && (
            <>
              {/* Color Palette (Theme Selection) */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sun size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Color Palette Selection</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Choose your color palette mode preference</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun size={18} />
                    <span>Light Theme Mode</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon size={18} />
                    <span>Dark Theme Mode</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${settings.theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}
                    onClick={() => handleThemeChange('system')}
                  >
                    <Sliders size={18} />
                    <span>Follow System Theme</span>
                  </button>
                </div>
              </div>

              {/* Print Preferences */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Print preferences</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Customize visibility elements on printed A5 invoices</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Company Logo</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Displays branding logo on A5 invoice & print templates</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showGstin} onChange={(e) => setShowGstin(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show GSTIN (GST Number)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints your GSTIN number on document receipts</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showAddress} onChange={(e) => setShowAddress(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Business Address</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints physical address details under headers</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showContact} onChange={(e) => setShowContact(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Contact Information</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints phone numbers, emails, and website fields</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showBankDetails} onChange={(e) => setShowBankDetails(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Banking Details</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints Bank Name, Account, IFSC, and UPI details</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showTerms} onChange={(e) => setShowTerms(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Terms & Conditions</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints default terms on invoice footer segments</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Warning & Alert Preferences */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Dashboard Alert Settings</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Toggle low stock and safety limit warnings</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showLowStockAlert} 
                      onChange={(e) => setShowLowStockAlert(e.target.checked)} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Below Safety Limit Warning</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Displays an alert when products fall below their minimum safety stock level</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showOutOfStockAlert} 
                      onChange={(e) => setShowOutOfStockAlert(e.target.checked)} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Completely Out of Stock Warning</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Displays an alert when products reach a stock count of zero</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Formatting & System Defaults */}
              <div className="card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Format Preferences</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Configure system date and local currency formats</p>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Local Currency Symbol</label>
                    <select 
                      className="form-control" 
                      value={currencySymbol} 
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                    >
                      <option value="₹">₹ (INR Rupee)</option>
                      <option value="$">$ (USD Dollar)</option>
                      <option value="€">€ (Euro)</option>
                      <option value="£">£ (Pound)</option>
                      <option value="¥">¥ (Yen)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">System Date Format</label>
                    <select 
                      className="form-control" 
                      value={dateFormat} 
                      onChange={(e) => setDateFormat(e.target.value)}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Database Maintenance */}
              <div className="card animate-fade-in" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1.5px solid rgba(239, 68, 68, 0.2)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-danger)', margin: 0 }}>Database Maintenance</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Perform database reset and factory default operations</p>
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Wipe out all local operational modifications (new invoices, custom stock rates) and restore to initial database seeding.
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ width: 'auto', padding: '10px 20px' }}
                    onClick={handleReset}
                  >
                    <RefreshCw size={16} />
                    <span>Reset Store Database</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 6: Staff & Roles Management (Redeveloped From Scratch) */}
          {activeTab === 'users' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {currentUser?.role !== 'Owner' ? (
                <div className="card" style={{ padding: '32px 24px', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
                  <ShieldAlert size={42} style={{ color: 'var(--color-danger)', margin: '0 auto 14px auto' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Restricted Access</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Staff & Employee Management is restricted exclusively to the Business Owner. Please contact your administrator for permission updates.
                  </p>
                </div>
              ) : (
                <>
                  {/* Top Summary & Action Header */}
                  <div className="card staff-header-card" style={{ padding: '20px 24px', borderRadius: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Staff & Roles Management
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        Control team access permissions, role assignments, and account security
                      </p>
                    </div>

                    <div className="staff-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {/* Metric Badges */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                          Total: {usersList.length}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)' }}>
                          Active: {usersList.filter((u) => u.status === 'Active').length}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setEditingStaffUser(null);
                          setStaffName('');
                          setStaffMobile('');
                          setStaffPassword('');
                          setStaffPin('');
                          setStaffRole('Accounts');
                          setStaffEmail('');
                          setStaffCustomPermissions([...(ROLE_PERMISSIONS['Accounts'] || [])]);
                          setIsAddUserModalOpen(true);
                        }}
                        style={{ borderRadius: '10px', padding: '9px 18px', fontWeight: 700, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                      >
                        <UserPlus size={16} /> Add Staff Member
                      </button>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="card staff-filters-row" style={{ padding: '14px 20px', borderRadius: '16px' }}>
                    <div className="staff-search-input-wrapper">
                      <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search staff by name or mobile number..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        style={{ paddingLeft: '36px', height: '40px', borderRadius: '10px', fontSize: '13px', width: '100%' }}
                      />
                    </div>

                    <div className="staff-filters-wrapper">
                      <select
                        className="form-control"
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value as any)}
                        style={{ height: '40px', borderRadius: '10px', fontSize: '13px' }}
                      >
                        <option value="All">All Roles</option>
                        <option value="Owner">Owner</option>
                        <option value="Accounts">Accounts</option>
                        <option value="Cashier">Cashier</option>
                      </select>

                      <select
                        className="form-control"
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value as any)}
                        style={{ height: '40px', borderRadius: '10px', fontSize: '13px' }}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Disabled</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop Employee Table (Hidden on Mobile <= 640px) */}
                  <div className="card desktop-only-table" style={{ padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="table-responsive">
                      <table className="table" style={{ margin: 0, width: '100%' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-app)' }}>
                            <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Staff Member</th>
                            <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Mobile (Login ID)</th>
                            <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>System Role</th>
                            <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Account Status</th>
                            <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Last Login</th>
                            <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersList
                            .filter((u) => {
                              const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || (u.mobile || '').includes(userSearch);
                              const matchRole = userRoleFilter === 'All' || u.role === userRoleFilter;
                              const matchStatus = userStatusFilter === 'All' || u.status === userStatusFilter;
                              return matchSearch && matchRole && matchStatus;
                            })
                            .map((u) => (
                              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '16px 20px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
                                    <div style={{
                                      width: '36px', height: '36px', borderRadius: '50%',
                                      backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0,
                                      border: '1px solid rgba(16, 185, 129, 0.2)',
                                      position: 'relative'
                                    }}>
                                      {getUserInitials(u.name)}
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{u.name}</div>
                                      {u.email && <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{u.email}</div>}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>
                                  +91 {u.mobile}
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                  <span style={{
                                    fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
                                    backgroundColor: u.role === 'Owner' ? 'rgba(16, 185, 129, 0.15)' : u.role === 'Accounts' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: u.role === 'Owner' ? 'var(--primary)' : u.role === 'Accounts' ? '#6366F1' : '#D97706',
                                    border: u.role === 'Owner' ? '1px solid rgba(16, 185, 129, 0.25)' : u.role === 'Accounts' ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)'
                                  }}>
                                    {u.role === 'Owner' ? '👑 Owner' : u.role === 'Accounts' ? '📊 Accounts' : '💵 Cashier'}
                                  </span>
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                  {u.status === 'Inactive' ? (
                                    <span className="badge badge-danger" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                      Disabled
                                    </span>
                                  ) : (
                                    <span className="badge badge-success" style={{ fontSize: '11px', padding: '3px 8px' }}>
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                  {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      title="Edit details & role"
                                      onClick={() => {
                                        setEditingStaffUser(u);
                                        setStaffName(u.name);
                                        setStaffMobile(u.mobile || '');
                                        setStaffRole(u.role);
                                        setStaffEmail(u.email || '');
                                        setStaffPassword('');
                                        setStaffPin('');
                                        setStaffCustomPermissions(u.customPermissions ? [...u.customPermissions] : [...(ROLE_PERMISSIONS[u.role] || [])]);
                                        setIsAddUserModalOpen(true);
                                      }}
                                    >
                                      <Edit2 size={13} /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${u.status === 'Active' ? 'btn-secondary danger' : 'btn-secondary'}`}
                                      title={u.role === 'Owner' ? 'Owner account cannot be disabled' : u.status === 'Active' ? 'Disable Account' : 'Enable Account'}
                                      disabled={u.role === 'Owner'}
                                      onClick={() => handleToggleUserStatus(u)}
                                      style={{ opacity: u.role === 'Owner' ? 0.5 : 1, cursor: u.role === 'Owner' ? 'not-allowed' : 'pointer' }}
                                    >
                                      {u.status === 'Active' ? <UserX size={13} /> : <UserCheck size={13} />}
                                      {u.status === 'Active' ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      title={u.role === 'Owner' ? 'Reset Owner Password & PIN' : 'Reset Staff Security PIN'}
                                      onClick={() => {
                                        setResetStaffUser(u);
                                        setNewResetPass('');
                                        setNewResetPin('');
                                      }}
                                    >
                                      <KeyRound size={13} /> Reset
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Staff Card List (Hidden on Desktop > 640px, Shown on Mobile <= 640px) */}
                  <div className="mobile-card-list">
                    {usersList
                      .filter((u) => {
                        const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || (u.mobile || '').includes(userSearch);
                        const matchRole = userRoleFilter === 'All' || u.role === userRoleFilter;
                        const matchStatus = userStatusFilter === 'All' || u.status === userStatusFilter;
                        return matchSearch && matchRole && matchStatus;
                      })
                      .map((u) => (
                        <div key={u.id} className="staff-mobile-card">
                          {/* Header Row: Avatar, Name, Mobile, Status Badge */}
                          <div className="staff-mobile-header">
                            <div className="staff-mobile-info-group">
                              <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px',
                                flexShrink: 0, position: 'relative'
                              }}>
                                {getUserInitials(u.name)}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div className="staff-mobile-name-text">{u.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>+91 {u.mobile}</div>
                              </div>
                            </div>
                            {u.status === 'Inactive' ? (
                              <span className="badge badge-danger" style={{ fontSize: '11px', flexShrink: 0 }}>
                                Disabled
                              </span>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: '11px', flexShrink: 0 }}>
                                Active
                              </span>
                            )}
                          </div>

                          {/* Meta Row: Role & Last Login */}
                          <div className="staff-mobile-meta-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
                              <span style={{
                                fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px',
                                backgroundColor: u.role === 'Owner' ? 'rgba(16, 185, 129, 0.15)' : u.role === 'Accounts' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: u.role === 'Owner' ? 'var(--primary)' : u.role === 'Accounts' ? '#6366F1' : '#D97706'
                              }}>
                                {u.role === 'Owner' ? '👑 Owner' : u.role === 'Accounts' ? '📊 Accounts' : '💵 Cashier'}
                              </span>
                            </div>
                            {u.lastLogin && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Last login: {new Date(u.lastLogin).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>

                          {/* Action Button Row */}
                          <div className="staff-mobile-actions-bar">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingStaffUser(u);
                                setStaffName(u.name);
                                setStaffMobile(u.mobile || '');
                                setStaffRole(u.role);
                                setStaffEmail(u.email || '');
                                setStaffPassword('');
                                setStaffPin('');
                                setStaffCustomPermissions(u.customPermissions ? [...u.customPermissions] : [...(ROLE_PERMISSIONS[u.role] || [])]);
                                setIsAddUserModalOpen(true);
                              }}
                            >
                              <Edit2 size={12} /> Edit
                            </button>

                            <button
                              type="button"
                              className={`btn btn-sm ${u.status === 'Active' ? 'btn-secondary danger' : 'btn-secondary'}`}
                              disabled={u.role === 'Owner'}
                              onClick={() => handleToggleUserStatus(u)}
                              style={{ opacity: u.role === 'Owner' ? 0.5 : 1, cursor: u.role === 'Owner' ? 'not-allowed' : 'pointer' }}
                            >
                              {u.status === 'Active' ? <UserX size={12} /> : <UserCheck size={12} />}
                              {u.status === 'Active' ? 'Disable' : 'Enable'}
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setResetStaffUser(u);
                                setNewResetPass('');
                                setNewResetPin('');
                              }}
                            >
                              <KeyRound size={12} /> Reset
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 7: Backup & Restore Dashboard */}
          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {currentUser?.role !== 'Owner' ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Access Restricted</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '14px' }}>
                    Only the registered Business Owner is authorized to generate or restore company data backups.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. TOP: Backup Overview Hero Section */}
                  <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                      {/* Left Side */}
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                          Backup & Restore
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 14px' }}>
                          Keep your business data protected and restore it whenever needed.
                        </p>
                        {/* System Health Badge */}
                        {backupHealth ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 700,
                            backgroundColor: backupHealth.healthState === 'HEALTHY' ? '#ecfdf5' : backupHealth.healthState === 'OVERDUE' ? '#fffbebfb' : '#fef2f2',
                            color: backupHealth.healthState === 'HEALTHY' ? '#065f46' : backupHealth.healthState === 'OVERDUE' ? '#92400e' : '#991b1b',
                            border: `1px solid ${backupHealth.healthState === 'HEALTHY' ? 'rgba(16, 185, 129, 0.3)' : backupHealth.healthState === 'OVERDUE' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}>
                            {backupHealth.healthState === 'HEALTHY' ? (
                              <>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                🟢 Your Backup System is Healthy
                              </>
                            ) : backupHealth.healthState === 'OVERDUE' ? (
                              <>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                                🔴 Backup Overdue
                              </>
                            ) : (
                              <>
                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                                🟠 Backup Requires Attention
                              </>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                            <RefreshCw size={14} className="spin" /> Checking backup health...
                          </div>
                        )}
                      </div>

                      {/* Right Side: Primary Backup Now Action */}
                      <div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleBackupNow}
                          disabled={isTriggeringBackupNow}
                          style={{
                            backgroundColor: '#2563eb',
                            borderColor: '#2563eb',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '14px',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {isTriggeringBackupNow ? (
                            <>
                              <RefreshCw size={16} className="spin" /> Uploading Backup...
                            </>
                          ) : (
                            <>
                              <UploadCloud size={16} /> Backup Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. BACKUP STATUS CARDS (4-Column Status Grid) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                    {/* Card 1: Last Successful Backup */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Last Successful Backup
                      </div>
                      {backupHistoryData?.lastSuccessfulBackup ? (
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {new Date(backupHistoryData.lastSuccessfulBackup.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                            {new Date(backupHistoryData.lastSuccessfulBackup.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {backupHistoryData.lastSuccessfulBackup.backupType || 'Automatic'}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No backups completed</div>
                      )}
                    </div>

                    {/* Card 2: Google Drive */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Google Drive
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: gdriveStatus?.connected ? '#059669' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: gdriveStatus?.connected ? '#10b981' : '#9ca3af' }}></span>
                          {gdriveStatus?.connected ? 'Connected' : 'Not Connected'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all', fontWeight: 500 }}>
                          {gdriveStatus?.connected ? (gdriveStatus.googleEmail || 'Connected') : 'Connect to enable auto backup'}
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Automatic Schedule */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Automatic Schedule
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Every Day
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                          02:00 AM IST
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Backup Retention */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        Retention Policy
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div><strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>7</strong> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Daily</span></div>
                        <div><strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>4</strong> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Weekly</span></div>
                        <div><strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>12</strong> <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Monthly</span></div>
                      </div>
                    </div>
                  </div>

                  {/* 3. AUTOMATIC GOOGLE DRIVE BACKUP SECTION */}
                  <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Automatic Google Drive Backup
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          Your business data is automatically backed up to your connected Google Drive.
                        </p>
                      </div>

                      {gdriveStatus?.connected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                            Connected to Google Drive ({gdriveStatus.googleEmail || 'Active'})
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleDisconnectGoogleDrive}
                            disabled={isDisconnectingDrive}
                            style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, padding: '6px 12px' }}
                          >
                            {isDisconnectingDrive ? <RefreshCw size={13} className="spin" /> : 'Disconnect'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleConnectGoogleDrive}
                            disabled={isConnectingDrive}
                            style={{ fontWeight: 700, fontSize: '13px', padding: '8px 16px' }}
                          >
                            {isConnectingDrive ? <RefreshCw size={14} className="spin" /> : <HardDrive size={14} />} Connect Google Drive
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. BACKUP HISTORY */}
                  <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Backup History
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          View, download, or restore your previous backups.
                        </p>
                      </div>
                      {backupHistoryData?.historyList && backupHistoryData.historyList.length > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {backupHistoryData.historyList.length} recorded backup{backupHistoryData.historyList.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    {backupHistoryData?.historyList && backupHistoryData.historyList.length > 0 ? (
                      <div>
                        {/* Desktop Modern Table View */}
                        <div className="d-none d-md-block table-responsive" style={{ overflowX: 'auto' }}>
                          <table className="table" style={{ fontSize: '13px', margin: 0, width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                              <tr style={{ borderBottom: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                <th style={{ padding: '12px 14px', whiteSpace: 'nowrap', width: '20%', textAlign: 'center', verticalAlign: 'middle' }}>Backup</th>
                                <th style={{ padding: '12px 14px', whiteSpace: 'nowrap', width: '25%', textAlign: 'center', verticalAlign: 'middle' }}>Date & Time</th>
                                <th style={{ padding: '12px 14px', whiteSpace: 'nowrap', width: '18%', textAlign: 'center', verticalAlign: 'middle' }}>Status</th>
                                <th style={{ padding: '12px 14px', whiteSpace: 'nowrap', width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>Size</th>
                                <th style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap', width: '25%', verticalAlign: 'middle' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {backupHistoryData.historyList.map((item: any) => {
                                const isUnavailable = item.failureReason && item.failureReason.toLowerCase().includes('unavailable');
                                return (
                                  <tr key={item._id || item.historyId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>
                                      📁 {item.backupType || 'Daily'} Backup
                                    </td>
                                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>
                                      {new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>
                                      {isUnavailable ? (
                                        <span className="badge badge-danger" style={{ fontSize: '11px', padding: '4px 8px' }}>🔴 Unavailable</span>
                                      ) : (
                                        <span className={`badge ${item.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                                          {item.status === 'SUCCESS' ? '🟢 Successful' : '🔴 Failed'}
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>
                                      {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : '-'}
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                                      {item.status === 'SUCCESS' && !isUnavailable ? (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                                          <button
                                            type="button"
                                            className="btn btn-secondary"
                                            style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            onClick={() => handleCloudPreview(item)}
                                            disabled={cloudPreviewLoadingId === item.historyId}
                                          >
                                            {cloudPreviewLoadingId === item.historyId ? <RefreshCw size={11} className="spin" /> : <Eye size={12} />} Preview
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-secondary"
                                            style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            onClick={() => handleCloudDownload(item)}
                                            disabled={cloudDownloadLoadingId === item.historyId}
                                          >
                                            {cloudDownloadLoadingId === item.historyId ? <RefreshCw size={11} className="spin" /> : <Download size={12} />} Download
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-primary"
                                            style={{ fontSize: '11px', padding: '5px 12px', backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            onClick={() => handleCloudPreview(item)}
                                            disabled={cloudPreviewLoadingId === item.historyId}
                                          >
                                            <RotateCcw size={12} /> Restore
                                          </button>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards View (< 768px) */}
                        <div className="d-block d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {backupHistoryData.historyList.map((item: any) => {
                            const isUnavailable = item.failureReason && item.failureReason.toLowerCase().includes('unavailable');
                            return (
                              <div key={item._id || item.historyId} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    📁 {item.backupType || 'Daily'} Backup
                                  </span>
                                  {isUnavailable ? (
                                    <span className="badge badge-danger" style={{ fontSize: '10px' }}>Unavailable</span>
                                  ) : (
                                    <span className={`badge ${item.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                                      {item.status === 'SUCCESS' ? '🟢 Successful' : '🔴 Failed'}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                  {new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                  {item.fileSize && <> • {(item.fileSize / 1024).toFixed(1)} KB</>}
                                </div>
                                {item.status === 'SUCCESS' && !isUnavailable && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ fontSize: '11px', padding: '8px 0', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleCloudPreview(item)}
                                      disabled={cloudPreviewLoadingId === item.historyId}
                                    >
                                      {cloudPreviewLoadingId === item.historyId ? <RefreshCw size={11} className="spin" /> : <Eye size={11} />} Preview
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ fontSize: '11px', padding: '8px 0', textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleCloudDownload(item)}
                                      disabled={cloudDownloadLoadingId === item.historyId}
                                    >
                                      {cloudDownloadLoadingId === item.historyId ? <RefreshCw size={11} className="spin" /> : <Download size={11} />} Download
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      style={{ fontSize: '11px', padding: '8px 0', backgroundColor: '#dc2626', borderColor: '#dc2626', textAlign: 'center', justifyContent: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleCloudPreview(item)}
                                      disabled={cloudPreviewLoadingId === item.historyId}
                                    >
                                      <RotateCcw size={11} /> Restore
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', border: '1px border-dashed var(--border-color)' }}>
                        <HardDrive size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>No backups yet</div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 16px' }}>
                          Your backup history will appear here after your first successful backup.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleBackupNow}
                          disabled={isTriggeringBackupNow}
                          style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', fontWeight: 700, fontSize: '13px', padding: '8px 18px' }}
                        >
                          <UploadCloud size={14} /> Backup Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 5. MANUAL BACKUP SECTION */}
                  <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
                        💾
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Download a Backup Copy
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                          Create a complete copy of your current business data and save it on your device.
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowManualBackupDetails(!showManualBackupDetails)}
                        style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: 'transparent', border: 'none' }}
                      >
                        {showManualBackupDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} What's Included?
                      </button>

                      {showManualBackupDetails && (
                        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          Includes: Customers, Suppliers, Products, Invoices, Quotations, Purchases, Expenses, Payments, and Recycle Bin items.
                          <br />
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            * Sensitive login passwords, auth credentials, and session tokens are strictly excluded.
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleCreateBackup}
                        disabled={isExportingBackup}
                        style={{ fontWeight: 700, padding: '10px 20px', fontSize: '13px' }}
                      >
                        {isExportingBackup ? (
                          <>
                            <RefreshCw size={15} className="spin" /> Creating Backup...
                          </>
                        ) : (
                          <>
                            <Download size={15} /> Create & Download Backup
                          </>
                        )}
                      </button>
                    </div>

                    {/* Recent Manual Export & Restore Summaries */}
                    {(lastBackupMeta || lastRestoreMeta) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {lastBackupMeta && (
                          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                              <Clock size={13} style={{ color: 'var(--primary)' }} />
                              <span>Most Recent Manual Export</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {new Date(lastBackupMeta.createdAt).toLocaleString()} • Created by {lastBackupMeta.createdBy || 'Owner'}
                            </div>
                          </div>
                        )}

                        {lastRestoreMeta && (
                          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#065f46', marginBottom: '2px' }}>
                              <FileCheck size={13} />
                              <span>Most Recent Restoration Event</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#047857' }}>
                              {new Date(lastRestoreMeta.restoredAt).toLocaleString()} • Restored by {lastRestoreMeta.restoredBy || 'Owner'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 6. RESTORE BUSINESS DATA SECTION */}
                  <div id="restore-section-card" className="card" style={{ padding: '24px', borderRadius: '16px', border: '1.5px solid rgba(239, 68, 68, 0.35)', backgroundColor: 'var(--card-bg)' }}>
                    <div style={{ borderBottom: '1.5px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RotateCcw size={18} style={{ color: '#dc2626' }} /> Restore Business Data
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        Replace your current business records using a previous backup.
                      </p>
                    </div>

                    {/* Two Large Selectable Source Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      {/* Card A: From Device */}
                      <div
                        onClick={() => setRestoreSourceTab('device')}
                        style={{
                          backgroundColor: restoreSourceTab === 'device' ? '#eff6ff' : 'var(--bg-secondary)',
                          border: restoreSourceTab === 'device' ? '2px solid #2563eb' : '1px solid var(--border-color)',
                          borderRadius: '14px',
                          padding: '18px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📱</div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: restoreSourceTab === 'device' ? '#1e40af' : 'var(--text-primary)', margin: '0 0 4px' }}>
                          From Device
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.4 }}>
                          Upload a backup JSON file from your phone or computer.
                        </p>
                        <button
                          type="button"
                          className={`btn ${restoreSourceTab === 'device' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '12px', fontWeight: 700, width: '100%' }}
                        >
                          <UploadCloud size={14} /> Choose Backup File
                        </button>
                      </div>

                      {/* Card B: From Google Drive */}
                      <div
                        onClick={() => setRestoreSourceTab('gdrive')}
                        style={{
                          backgroundColor: restoreSourceTab === 'gdrive' ? '#eff6ff' : 'var(--bg-secondary)',
                          border: restoreSourceTab === 'gdrive' ? '2px solid #2563eb' : '1px solid var(--border-color)',
                          borderRadius: '14px',
                          padding: '18px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>☁️</div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: restoreSourceTab === 'gdrive' ? '#1e40af' : 'var(--text-primary)', margin: '0 0 4px' }}>
                          From Google Drive
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.4 }}>
                          Select one of your available cloud backups.
                        </p>
                        <button
                          type="button"
                          className={`btn ${restoreSourceTab === 'gdrive' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '12px', fontWeight: 700, width: '100%' }}
                        >
                          <HardDrive size={14} /> Select Cloud Backup
                        </button>
                      </div>
                    </div>

                    {/* FOCUSED RESTORE WORKFLOW (Expanded only when source active) */}

                    {/* WORKFLOW A: From Device */}
                    {restoreSourceTab === 'device' && (
                      <div>
                        {/* Hidden file input */}
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                          style={{ display: 'none' }}
                          id="backup-file-input"
                        />
                        <div style={{ marginBottom: '16px' }}>
                          <label htmlFor="backup-file-input" className="btn btn-secondary" style={{ cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                            <UploadCloud size={15} /> Select Device Backup (.json)
                          </label>
                          {selectedBackupFile && (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginLeft: '12px' }}>
                              {selectedBackupFile.name} ({(selectedBackupFile.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>

                        {isValidatingBackup && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
                            <RefreshCw size={15} className="spin" style={{ color: 'var(--primary)' }} />
                            <span>Validating Backup...</span>
                          </div>
                        )}

                        {/* 7. BACKUP PREVIEW DESIGN (Device) */}
                        {validationResult && (
                          <div style={{ marginBottom: '20px' }}>
                            {!validationResult.valid ? (
                              <div style={{ padding: '14px', backgroundColor: '#fef2f2', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#991b1b', fontSize: '13px' }}>
                                <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <AlertCircle size={16} /> Backup File Invalid
                                </div>
                                <div>{validationResult.message}</div>
                              </div>
                            ) : (
                              <div style={{ border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: '#ecfdf5', borderRadius: '14px', padding: '18px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <FileCheck size={18} /> Ready to Restore
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px', color: '#047857', marginBottom: '16px' }}>
                                  <div><strong>Company:</strong> {validationResult.metadata?.companyName}</div>
                                  <div><strong>Backup Created:</strong> {new Date(validationResult.metadata?.createdAt).toLocaleString()}</div>
                                </div>

                                {/* Record Counts Compact Statistic Cards Grid */}
                                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#065f46', marginBottom: '10px' }}>
                                    Record Summary Preview:
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', fontSize: '12px' }}>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>👥 Customers: <strong>{validationResult.dataSummary?.customers || 0}</strong></div>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>🏭 Suppliers: <strong>{validationResult.dataSummary?.suppliers || 0}</strong></div>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>📦 Products: <strong>{validationResult.dataSummary?.products || 0}</strong></div>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>📄 Invoices: <strong>{validationResult.dataSummary?.invoices || 0}</strong></div>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>📋 Quotations: <strong>{validationResult.dataSummary?.quotations || 0}</strong></div>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>🛒 Purchases: <strong>{validationResult.dataSummary?.purchases || 0}</strong></div>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>💸 Expenses: <strong>{validationResult.dataSummary?.expenses || 0}</strong></div>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>💳 Payments: <strong>{validationResult.dataSummary?.payments || 0}</strong></div>
                                    <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>🗑️ Recycle Bin: <strong>{validationResult.dataSummary?.recycleBin || 0}</strong></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 8. CONFIRMATION & RESTORE (Device) */}
                        {validationResult?.valid && (
                          <div style={{ backgroundColor: '#fff1f2', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '14px', padding: '18px' }}>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#be123c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AlertTriangle size={18} /> ⚠ Important
                            </div>
                            <p style={{ fontSize: '13px', color: '#9f1239', lineHeight: 1.5, margin: '0 0 12px' }}>
                              Restoring this backup will replace your current business data.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#047857', fontWeight: 700, marginBottom: '16px', backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px' }}>
                              <div>✓ Company account will remain unchanged</div>
                              <div>✓ Users and login access will remain unchanged</div>
                              <div>✓ Google Drive connection will remain unchanged</div>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                              <label className="form-label" style={{ fontWeight: 700, color: '#881337', fontSize: '12px' }}>
                                Type <strong>RESTORE</strong> to continue:
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Type RESTORE to confirm"
                                value={restoreConfirmText}
                                onChange={(e) => setRestoreConfirmText(e.target.value)}
                                style={{ maxWidth: '280px', borderColor: restoreConfirmText === 'RESTORE' ? '#10b981' : '#f43f5e' }}
                              />
                            </div>

                            {restoreErrorMsg && (
                              <div style={{ color: '#e11d48', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                                {restoreErrorMsg}
                              </div>
                            )}

                            <button
                              type="button"
                              className="btn btn-secondary danger"
                              disabled={restoreConfirmText !== 'RESTORE' || isRestoring}
                              onClick={handleExecuteRestore}
                              style={{
                                backgroundColor: restoreConfirmText === 'RESTORE' ? '#dc2626' : undefined,
                                color: restoreConfirmText === 'RESTORE' ? '#ffffff' : undefined,
                                opacity: restoreConfirmText === 'RESTORE' && !isRestoring ? 1 : 0.6,
                                fontWeight: 800,
                              }}
                            >
                              {isRestoring ? (
                                <>
                                  <RefreshCw size={15} className="spin" /> Restoring Data...
                                </>
                              ) : (
                                'Restore Business Data'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* WORKFLOW B: From Google Drive */}
                    {restoreSourceTab === 'gdrive' && (
                      <div>
                        {selectedCloudHistory && cloudValidationResult ? (
                          <div>
                            {/* 7. BACKUP PREVIEW DESIGN (Cloud) */}
                            <div style={{ border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: '#ecfdf5', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileCheck size={18} /> Ready to Restore
                              </h4>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px', color: '#047857', marginBottom: '16px' }}>
                                <div><strong>Selected File:</strong> {selectedCloudHistory.fileName}</div>
                                <div><strong>Backup Date:</strong> {new Date(selectedCloudHistory.createdAt).toLocaleString()}</div>
                              </div>

                              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#065f46', marginBottom: '10px' }}>
                                  Record Summary Preview:
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', fontSize: '12px' }}>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>👥 Customers: <strong>{cloudValidationResult.dataSummary?.customers || 0}</strong></div>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>🏭 Suppliers: <strong>{cloudValidationResult.dataSummary?.suppliers || 0}</strong></div>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>📦 Products: <strong>{cloudValidationResult.dataSummary?.products || 0}</strong></div>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>📄 Invoices: <strong>{cloudValidationResult.dataSummary?.invoices || 0}</strong></div>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>📋 Quotations: <strong>{cloudValidationResult.dataSummary?.quotations || 0}</strong></div>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>🛒 Purchases: <strong>{cloudValidationResult.dataSummary?.purchases || 0}</strong></div>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>💸 Expenses: <strong>{cloudValidationResult.dataSummary?.expenses || 0}</strong></div>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>💳 Payments: <strong>{cloudValidationResult.dataSummary?.payments || 0}</strong></div>
                                  <div style={{ backgroundColor: '#f0fdf4', padding: '8px 10px', borderRadius: '8px' }}>🗑️ Recycle Bin: <strong>{cloudValidationResult.dataSummary?.recycleBin || 0}</strong></div>
                                </div>
                              </div>
                            </div>

                            {/* 8. CONFIRMATION & RESTORE (Cloud) */}
                            <div style={{ backgroundColor: '#fff1f2', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '14px', padding: '18px' }}>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#be123c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={18} /> ⚠ Important
                              </div>
                              <p style={{ fontSize: '13px', color: '#9f1239', lineHeight: 1.5, margin: '0 0 12px' }}>
                                Restoring this backup will replace your current business data.
                              </p>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#047857', fontWeight: 700, marginBottom: '16px', backgroundColor: '#ffffff', padding: '12px', borderRadius: '10px' }}>
                                <div>✓ Company account will remain unchanged</div>
                                <div>✓ Users and login access will remain unchanged</div>
                                <div>✓ Google Drive connection will remain unchanged</div>
                              </div>

                              <div style={{ marginBottom: '14px' }}>
                                <label className="form-label" style={{ fontWeight: 700, color: '#881337', fontSize: '12px' }}>
                                  Type <strong>RESTORE</strong> to continue:
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Type RESTORE to confirm"
                                  value={cloudConfirmInput}
                                  onChange={(e) => setCloudConfirmInput(e.target.value)}
                                  style={{ maxWidth: '280px', borderColor: cloudConfirmInput === 'RESTORE' ? '#10b981' : '#f43f5e' }}
                                />
                              </div>

                              {cloudRestoreErrorMsg && (
                                <div style={{ color: '#e11d48', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                                  {cloudRestoreErrorMsg}
                                </div>
                              )}

                              <button
                                type="button"
                                className="btn btn-secondary danger"
                                disabled={cloudConfirmInput !== 'RESTORE' || isRestoringCloud}
                                onClick={handleExecuteCloudRestore}
                                style={{
                                  backgroundColor: cloudConfirmInput === 'RESTORE' ? '#dc2626' : undefined,
                                  color: cloudConfirmInput === 'RESTORE' ? '#ffffff' : undefined,
                                  opacity: cloudConfirmInput === 'RESTORE' && !isRestoringCloud ? 1 : 0.6,
                                  fontWeight: 800,
                                }}
                              >
                                {isRestoringCloud ? (
                                  <>
                                    <RefreshCw size={15} className="spin" /> Restoring Data...
                                  </>
                                ) : (
                                  'Restore Selected Backup From Google Drive'
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '32px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px border-dashed var(--border-color)' }}>
                            <HardDrive size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Select a Backup from Backup History Above</div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0' }}>
                              Click <strong>Preview</strong> or <strong>Restore</strong> on any backup in the Backup History section above to load its cloud preview.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 8: Erase Business Data Dashboard */}
          {activeTab === 'erase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {currentUser?.role !== 'Owner' ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Access Restricted</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '14px' }}>
                    Only the registered Business Owner is authorized to erase company business data.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. PAGE HEADER */}
                  <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                          Erase Business Data
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                          Remove your business records while keeping your company account and login access safe.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={fetchEraseSummary}
                        disabled={isLoadingEraseSummary}
                        style={{ fontSize: '12px', padding: '6px 14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={13} className={isLoadingEraseSummary ? 'spin' : ''} /> Refresh Counts
                      </button>
                    </div>
                  </div>

                  {/* 7. UNDO LAST ERASE (PROMINENT IF SNAPSHOT EXISTS) */}
                  {eraseSummaryData?.activeTemporaryErase && (
                    <div style={{ border: '2px solid #10b981', backgroundColor: '#ecfdf5', borderRadius: '16px', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46' }}>
                          <RotateCcw size={20} />
                          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Undo Last Erase Available</h3>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '11px', padding: '5px 10px', fontWeight: 700 }}>
                          UNDO AVAILABLE
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', color: '#047857', margin: '0 0 14px', lineHeight: 1.5 }}>
                        Restore the business data removed by your most recent temporary erase for <strong>{eraseSummaryData?.companyName}</strong>.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px', color: '#065f46', backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '16px' }}>
                        <div><strong>Last Erased:</strong> {new Date(eraseSummaryData.activeTemporaryErase.erasedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                        <div><strong>Performed By:</strong> {eraseSummaryData.activeTemporaryErase.erasedBy || 'Owner'}</div>
                      </div>

                      {eraseSummaryData.activeTemporaryErase.dataSummary && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#047857', marginBottom: '8px' }}>
                            Records Available to Restore:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <span className="badge badge-secondary" style={{ backgroundColor: '#ffffff', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Customers: {eraseSummaryData.activeTemporaryErase.dataSummary.customers || 0}</span>
                            <span className="badge badge-secondary" style={{ backgroundColor: '#ffffff', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Suppliers: {eraseSummaryData.activeTemporaryErase.dataSummary.suppliers || 0}</span>
                            <span className="badge badge-secondary" style={{ backgroundColor: '#ffffff', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Products: {eraseSummaryData.activeTemporaryErase.dataSummary.products || 0}</span>
                            <span className="badge badge-secondary" style={{ backgroundColor: '#ffffff', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Invoices: {eraseSummaryData.activeTemporaryErase.dataSummary.invoices || 0}</span>
                            <span className="badge badge-secondary" style={{ backgroundColor: '#ffffff', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Quotations: {eraseSummaryData.activeTemporaryErase.dataSummary.quotations || 0}</span>
                            <span className="badge badge-secondary" style={{ backgroundColor: '#ffffff', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Purchases: {eraseSummaryData.activeTemporaryErase.dataSummary.purchases || 0}</span>
                            <span className="badge badge-secondary" style={{ backgroundColor: '#ffffff', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Expenses: {eraseSummaryData.activeTemporaryErase.dataSummary.expenses || 0}</span>
                            <span className="badge badge-secondary" style={{ backgroundColor: '#ffffff', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Payments: {eraseSummaryData.activeTemporaryErase.dataSummary.payments || 0}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleUndoLastErase}
                        disabled={isUndoingErase}
                        style={{ backgroundColor: '#059669', borderColor: '#059669', fontWeight: 800, fontSize: '13px', padding: '10px 20px' }}
                      >
                        {isUndoingErase ? (
                          <>
                            <RefreshCw size={15} className="spin" /> Restoring Business Data...
                          </>
                        ) : (
                          <>
                            <RotateCcw size={15} /> Undo Last Erase
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* 2. CURRENT BUSINESS DATA */}
                  <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          Current Business Data
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                          Active operational records for <strong>{eraseSummaryData?.companyName || currentCompany?.businessName}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Operational Record Statistic Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customers</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.customers || 0}</div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suppliers</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.suppliers || 0}</div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Products</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.products || 0}</div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales Invoices</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.invoices || 0}</div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quotations</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.quotations || 0}</div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purchases</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.purchases || 0}</div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expenses</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.expenses || 0}</div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payments</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.payments || 0}</div>
                      </div>
                      <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recycle Bin</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{eraseSummaryData?.summary?.recycleBin || 0}</div>
                      </div>
                    </div>

                    {/* 8. EMPTY STATE AFTER ERASURE */}
                    {eraseSummaryData?.summary && Object.values(eraseSummaryData.summary).every((val: any) => Number(val) === 0) && (
                      <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px border-dashed var(--border-color)', textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>📁 No Business Records</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Your business data has been erased. Your company account and login access are still active.
                        </div>
                      </div>
                    )}

                    {/* 3. YOUR ACCOUNT WILL STAY SAFE */}
                    <div style={{ border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: '#ecfdf5', borderRadius: '14px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Your Account Will Stay Safe
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px', color: '#047857', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> Company Account: <strong>Will remain</strong></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> Users & Credentials: <strong>Will remain</strong></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> Login & Access: <strong>Will remain</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* 4. ERASE MODE SELECTION (CHOOSE WHAT YOU WANT TO DO) */}
                  <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                      Choose What You Want To Do
                    </h3>

                    {/* Two Large Selectable Mode Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      {/* Mode Card 1: Temporary Erase */}
                      <div
                        onClick={() => { setSelectedEraseMode('temporary'); setEraseConfirmText(''); setEraseErrorMsg(''); }}
                        style={{
                          border: selectedEraseMode === 'temporary' ? '2px solid #2563eb' : '1px solid var(--border-color)',
                          backgroundColor: selectedEraseMode === 'temporary' ? '#eff6ff' : 'var(--bg-card)',
                          borderRadius: '14px',
                          padding: '18px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: selectedEraseMode === 'temporary' ? '#1e40af' : 'var(--text-primary)', fontSize: '16px' }}>
                            <RotateCcw size={20} /> Temporary Erase
                          </div>
                          <span className="badge badge-success" style={{ fontSize: '11px', padding: '4px 8px', fontWeight: 700 }}>
                            UNDO AVAILABLE
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          Temporarily remove your business data. Your latest erased data can be restored using Undo Last Erase.
                        </p>
                      </div>

                      {/* Mode Card 2: Permanent Erase */}
                      <div
                        onClick={() => { setSelectedEraseMode('permanent'); setEraseConfirmText(''); setEraseErrorMsg(''); }}
                        style={{
                          border: selectedEraseMode === 'permanent' ? '2px solid #dc2626' : '1px solid var(--border-color)',
                          backgroundColor: selectedEraseMode === 'permanent' ? '#fff1f2' : 'var(--bg-card)',
                          borderRadius: '14px',
                          padding: '18px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: selectedEraseMode === 'permanent' ? '#991b1b' : 'var(--text-primary)', fontSize: '16px' }}>
                            <Flame size={20} style={{ color: '#dc2626' }} /> Permanent Erase
                          </div>
                          <span className="badge badge-danger" style={{ fontSize: '11px', padding: '4px 8px', fontWeight: 700 }}>
                            IRREVERSIBLE
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          Permanently remove all business data. This action cannot be undone.
                        </p>
                      </div>
                    </div>

                    {/* 5 & 6. CONFIRMATION WORKFLOWS (Only expanded for selected mode) */}

                    {/* 5. TEMPORARY ERASE CONFIRMATION */}
                    {selectedEraseMode === 'temporary' && (
                      <div style={{ backgroundColor: '#fffbebfb', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 800, fontSize: '15px', marginBottom: '8px' }}>
                          <RotateCcw size={18} /> Temporary Erase
                        </div>
                        <p style={{ fontSize: '13px', color: '#b45309', lineHeight: 1.5, margin: '0 0 16px' }}>
                          Your business records will be removed from the active company, but the latest erased data will be saved so you can undo this action.
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                          <label className="form-label" style={{ fontWeight: 700, color: '#78350f', fontSize: '12px' }}>
                            Type <strong>ERASE</strong> to continue:
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type ERASE to confirm"
                            value={eraseConfirmText}
                            onChange={(e) => setEraseConfirmText(e.target.value)}
                            style={{ maxWidth: '280px', borderColor: eraseConfirmText === 'ERASE' ? '#10b981' : '#f59e0b' }}
                          />
                        </div>

                        {eraseErrorMsg && (
                          <div style={{ color: '#e11d48', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                            {eraseErrorMsg}
                          </div>
                        )}

                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={eraseConfirmText !== 'ERASE' || isExecutingErase}
                          onClick={handleExecuteEraseMode}
                          style={{
                            backgroundColor: eraseConfirmText === 'ERASE' ? '#d97706' : undefined,
                            borderColor: eraseConfirmText === 'ERASE' ? '#d97706' : undefined,
                            color: eraseConfirmText === 'ERASE' ? '#ffffff' : undefined,
                            opacity: eraseConfirmText === 'ERASE' && !isExecutingErase ? 1 : 0.6,
                            fontWeight: 800,
                            fontSize: '13px',
                            padding: '10px 20px',
                          }}
                        >
                          {isExecutingErase ? (
                            <>
                              <RefreshCw size={15} className="spin" /> Erasing Business Data...
                            </>
                          ) : (
                            'Temporarily Erase Business Data'
                          )}
                        </button>
                      </div>
                    )}

                    {/* 6. PERMANENT ERASE CONFIRMATION */}
                    {selectedEraseMode === 'permanent' && (
                      <div style={{ backgroundColor: '#fff1f2', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 800, fontSize: '15px', marginBottom: '8px' }}>
                          <AlertTriangle size={20} style={{ color: '#dc2626' }} /> ⚠ Permanent Deletion
                        </div>
                        <p style={{ fontSize: '13px', color: '#9f1239', lineHeight: 1.5, margin: '0 0 4px', fontWeight: 700 }}>
                          You are about to permanently delete all business data for {eraseSummaryData?.companyName || currentCompany?.businessName || 'your company'}.
                        </p>
                        <p style={{ fontSize: '12px', color: '#be123c', margin: '0 0 16px' }}>
                          This action cannot be undone.
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                          <label className="form-label" style={{ fontWeight: 700, color: '#881337', fontSize: '12px' }}>
                            Type <strong>ERASE</strong> to continue:
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type ERASE to confirm"
                            value={eraseConfirmText}
                            onChange={(e) => setEraseConfirmText(e.target.value)}
                            style={{ maxWidth: '280px', borderColor: eraseConfirmText === 'ERASE' ? '#10b981' : '#f43f5e' }}
                          />
                        </div>

                        {eraseErrorMsg && (
                          <div style={{ color: '#e11d48', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                            {eraseErrorMsg}
                          </div>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary danger"
                          disabled={eraseConfirmText !== 'ERASE' || isExecutingErase}
                          onClick={handleExecuteEraseMode}
                          style={{
                            backgroundColor: eraseConfirmText === 'ERASE' ? '#dc2626' : undefined,
                            borderColor: eraseConfirmText === 'ERASE' ? '#dc2626' : undefined,
                            color: eraseConfirmText === 'ERASE' ? '#ffffff' : undefined,
                            opacity: eraseConfirmText === 'ERASE' && !isExecutingErase ? 1 : 0.6,
                            fontWeight: 800,
                            fontSize: '13px',
                            padding: '10px 20px',
                          }}
                        >
                          {isExecutingErase ? (
                            <>
                              <RefreshCw size={15} className="spin" /> Deleting Permanently...
                            </>
                          ) : (
                            'Permanently Erase Business Data'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Persistent Action Footer with Inline Success Banner (Only for form tabs) */}
          {activeTab !== 'users' && activeTab !== 'backup' && activeTab !== 'erase' && (
            <div className="settings-footer-unified">
              <div style={{ flex: 1 }}>
                {savedSuccess && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#065f46',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    animation: 'fadeIn 0.2s ease-out',
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                    <span>Preferences saved successfully!</span>
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', fontWeight: 700 }}>
                Save Settings
              </button>
            </div>
          )}

        </div>
      </form>
      {/* Add / Edit Staff User Modal */}
      {isAddUserModalOpen && (
        <Modal
          isOpen={isAddUserModalOpen}
          onClose={() => {
            setIsAddUserModalOpen(false);
            setEditingStaffUser(null);
          }}
          title={editingStaffUser ? `Edit Staff Member - ${editingStaffUser.name}` : 'Add New Staff Employee'}
        >
          <form onSubmit={handleSaveStaffUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Full Name *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Sharma"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Mobile Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="tel"
                className="form-control"
                placeholder="10-digit mobile number"
                value={staffMobile}
                onChange={(e) => setStaffMobile(e.target.value)}
                disabled={!!editingStaffUser}
                maxLength={10}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Assigned System Role *
              </label>
              <select
                className="form-control"
                value={staffRole}
                onChange={(e) => handleStaffRoleChange(e.target.value as UserRole)}
                required
              >
                <option value="Accounts">Accounts (Purchases, Inventory, Expenses, Reports, GST)</option>
                <option value="Cashier">Cashier (Billing, POS Invoices, Payments)</option>
                <option value="Owner">Owner (Full System Access)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Email Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. staff@agribizstore.com"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                {editingStaffUser ? 'Security PIN (leave blank to keep current)' : 'Security PIN (4 Digits) *'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                className="form-control"
                placeholder={editingStaffUser ? 'Enter new 4-digit PIN if changing' : 'Enter 4-digit numeric PIN (e.g. 1234)'}
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                required={!editingStaffUser}
                style={{ letterSpacing: '4px', fontWeight: 800, fontSize: '15px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Used for 4-digit PIN staff login and instant staff switching
              </span>
            </div>

            {/* Custom Page Access Checkboxes */}
            <div className="form-group" style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', margin: 0 }}>
                  Custom Page Access Permissions
                </label>
                {staffRole !== 'Owner' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => setStaffCustomPermissions([...(ROLE_PERMISSIONS[staffRole] || [])])}
                  >
                    Reset to {staffRole} Defaults
                  </button>
                )}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                Check individual pages to grant custom module permissions for this staff member:
              </p>

              {staffRole === 'Owner' ? (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', fontSize: '12px', fontWeight: 700 }}>
                  👑 Owner role possesses full access to all system pages & administrative modules.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-app)' }}>
                  {ALL_PAGE_PERMISSIONS.map((perm) => {
                    const isChecked = staffCustomPermissions.includes('*') || staffCustomPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'var(--card-bg)',
                          border: isChecked ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: isChecked ? 700 : 500
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStaffCustomPermissions((prev) => [...prev.filter((p) => p !== '*'), perm.id]);
                            } else {
                              setStaffCustomPermissions((prev) => prev.filter((p) => p !== perm.id && p !== '*'));
                            }
                          }}
                          style={{ accentColor: 'var(--primary)', width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  setEditingStaffUser(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingStaffUser ? 'Update Staff Member' : 'Create Staff Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Credentials Modal */}
      {resetStaffUser && (
        <Modal
          isOpen={!!resetStaffUser}
          onClose={() => {
            setResetStaffUser(null);
            setNewResetPass('');
            setNewResetPin('');
          }}
          title={resetStaffUser.role === 'Owner' ? `👑 Reset Owner Credentials — ${resetStaffUser.name}` : `🔑 Reset Security PIN — ${resetStaffUser.name}`}
        >
          <form onSubmit={handleResetUserPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {resetStaffUser.role === 'Owner' ? (
              <>
                <div style={{
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.4',
                }}>
                  As the <strong>Business Owner</strong>, you can update your login password and/or your 4-digit PIN below.
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    New Login Password <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional, Min 6 chars)</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter new login password"
                    value={newResetPass}
                    onChange={(e) => setNewResetPass(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    New 4-Digit Owner PIN <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    className="form-control"
                    placeholder="Enter 4-digit numeric PIN"
                    value={newResetPin}
                    onChange={(e) => setNewResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ fontSize: '18px', letterSpacing: '4px', fontWeight: 800 }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.4',
                }}>
                  Set a new 4-digit security PIN for staff member <strong>{resetStaffUser.name}</strong> (+91 {resetStaffUser.mobile || 'Staff'}).
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                    New 4-Digit Security PIN *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    className="form-control"
                    placeholder="Enter 4-digit PIN (e.g. 1234)"
                    value={newResetPin}
                    onChange={(e) => setNewResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ fontSize: '20px', letterSpacing: '6px', fontWeight: 800 }}
                    required
                    autoFocus
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setResetStaffUser(null);
                  setNewResetPass('');
                  setNewResetPin('');
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
                {resetStaffUser.role === 'Owner' ? 'Save Owner Credentials' : 'Reset Security PIN'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Business Account Confirmation Modal */}
      {isDeleteCompanyModalOpen && (
        <Modal
          isOpen={isDeleteCompanyModalOpen}
          onClose={() => {
            if (!deleteLoading) {
              setIsDeleteCompanyModalOpen(false);
            }
          }}
          title="🔥 Delete Business Account Permanently"
        >
          <form onSubmit={handleDeleteBusinessAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#B91C1C',
              fontSize: '13px',
              lineHeight: '1.5',
            }}>
              <strong>⚠️ CRITICAL WARNING:</strong> This will permanently erase <strong>{currentCompany?.businessName}</strong> and ALL associated data from MongoDB (staff, sales, purchases, inventory, payments, reports, tokens) and clear all local offline caches.
            </div>

            {deleteErrorMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444', fontSize: '13px', fontWeight: 600,
              }}>
                {deleteErrorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
                Type <span style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>DELETE</span> to confirm *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                required
                autoFocus
                disabled={deleteLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-primary)' }}>
                Owner Password or 4-Digit PIN *
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your Owner Password or 4-digit PIN"
                value={deletePasswordOrPin}
                onChange={(e) => setDeletePasswordOrPin(e.target.value)}
                required
                disabled={deleteLoading}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleteLoading}
                onClick={() => setIsDeleteCompanyModalOpen(false)}
                style={{ flex: 1, borderRadius: '10px', height: '44px', fontWeight: 700, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={deleteLoading || deleteConfirmText !== 'DELETE' || !deletePasswordOrPin.trim()}
                style={{
                  flex: 1,
                  borderRadius: '10px',
                  height: '44px',
                  fontWeight: 800,
                  justifyContent: 'center',
                  backgroundColor: deleteConfirmText === 'DELETE' && deletePasswordOrPin.trim() ? '#EF4444' : 'var(--border-color,#cbd5e1)',
                  color: '#FFFFFF',
                  border: 'none',
                  boxShadow: deleteConfirmText === 'DELETE' && deletePasswordOrPin.trim() ? '0 4px 14px rgba(239,68,68,0.3)' : 'none',
                  cursor: deleteConfirmText === 'DELETE' && deletePasswordOrPin.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {deleteLoading ? 'Deleting Account...' : '🔥 Permanently Delete'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
