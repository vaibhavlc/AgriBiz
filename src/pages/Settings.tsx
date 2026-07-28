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
} from 'lucide-react';
import { getFullAddress, initialSettings, toTitleCase } from '../utils/dummyData';

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
  const { settings, updateSettings, resetToDefault, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'banking' | 'branding' | 'prefixes' | 'system' | 'users'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const { currentUser, currentCompany } = useAuth();
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
      if (detail && detail.userId) {
        setUsersList(prev => prev.map(u => u.id === detail.userId ? { ...u, presenceStatus: detail.presenceStatus } : u));
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
      showToast('The Owner account is the primary administrator and cannot be disabled.', 'warning');
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
  const [isDrawing, setIsDrawing] = useState(false);
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

  const getEventCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    } else {
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    const coords = getEventCoords(e, canvas);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1E3A8A'; // Professional dark blue ink
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
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
    updateSettings({
      ...settings,
      signature: undefined
    });
    if (showToast) {
      showToast('Signature removed successfully!');
    }
  };

  const handleReset = () => {
    if (confirm('WARNING: Wiping database will delete all sales invoices, purchases, payments, and custom customer profiles. This resets AgriBiz to original sample data. Proceed?')) {
      resetToDefault();
      alert('AgriBiz database reset to initial mock states successfully.');
      window.location.reload();
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({
      ...settings,
      theme,
    });
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
                      <div style={{ border: '2px dashed var(--border-color)', padding: '10px', borderRadius: '12px', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
                        <img src={logo} alt="Branding Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
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
                    <div style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '16px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <ImageIcon size={40} style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Upload Business Logo</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG, or SVG format up to 1.5MB</div>
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
                  {savedSignature ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ border: '2px dashed var(--border-color)', padding: '10px', borderRadius: '12px', width: '240px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                        <img src={savedSignature} alt="E-Signature Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      </div>
                      <button type="button" onClick={handleRemoveSignature} className="btn btn-danger btn-sm">
                        <Trash2 size={14} /> Remove Signature
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Draw your signature inside the box below in blue ink (automatically cropped to boundaries on save):
                      </div>
                      <div style={{ position: 'relative', border: '2px dashed var(--border-color)', borderRadius: '12px', backgroundColor: '#fff', overflow: 'hidden', height: '120px' }}>
                        <canvas
                          ref={canvasRef}
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={clearSignaturePad} className="btn btn-secondary btn-sm">
                          Clear Pad
                        </button>
                        <button type="button" onClick={handleSaveSignature} className="btn btn-primary btn-sm">
                          Save Signature
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
                  <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Staff & Roles Management
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        Control team access permissions, role assignments, and account security
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                                      {u.name.charAt(0).toUpperCase()}
                                      <span style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        right: '-2px',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        border: '1.5px solid var(--card-bg, #ffffff)',
                                        backgroundColor: (u as any).presenceStatus === 'busy' ? '#EF4444' : (u as any).presenceStatus === 'away' ? '#F59E0B' : '#10B981',
                                        display: 'inline-block'
                                      }} title={(u as any).presenceStatus || 'online'}></span>
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
                                    <span className={`badge ${
                                      u.presenceStatus === 'busy' ? 'badge-danger' : u.presenceStatus === 'away' ? 'badge-warning' : 'badge-success'
                                    }`} style={{ fontSize: '11px', padding: '3px 8px', textTransform: 'capitalize' }}>
                                      {u.presenceStatus || 'online'}
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
                        <div key={u.id} className="mobile-list-card" style={{ borderRadius: '14px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px',
                                position: 'relative'
                              }}>
                                {u.name.charAt(0).toUpperCase()}
                                <span style={{
                                  position: 'absolute',
                                  bottom: '-2px',
                                  right: '-2px',
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  border: '1.5px solid var(--card-bg, #ffffff)',
                                  backgroundColor: (u as any).presenceStatus === 'busy' ? '#EF4444' : (u as any).presenceStatus === 'away' ? '#F59E0B' : '#10B981',
                                  display: 'inline-block'
                                }} title={(u as any).presenceStatus || 'online'}></span>
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>{u.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>+91 {u.mobile}</div>
                              </div>
                            </div>
                            {u.status === 'Inactive' ? (
                              <span className="badge badge-danger" style={{ fontSize: '11px' }}>
                                Disabled
                              </span>
                            ) : (
                              <span className={`badge ${
                                u.presenceStatus === 'busy' ? 'badge-danger' : u.presenceStatus === 'away' ? 'badge-warning' : 'badge-success'
                              }`} style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                                {u.presenceStatus || 'online'}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', marginTop: '4px', borderTop: '1px dashed var(--border-color)' }}>
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

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => {
                                  setEditingStaffUser(u);
                                  setStaffName(u.name);
                                  setStaffMobile(u.mobile || '');
                                  setStaffRole(u.role);
                                  setStaffEmail(u.email || '');
                                  setStaffPassword('');
                                  setStaffCustomPermissions(u.customPermissions ? [...u.customPermissions] : [...(ROLE_PERMISSIONS[u.role] || [])]);
                                  setIsAddUserModalOpen(true);
                                }}
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm ${u.status === 'Active' ? 'btn-secondary danger' : 'btn-secondary'}`}
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                disabled={u.id === currentUser.id}
                                onClick={() => handleToggleUserStatus(u)}
                              >
                                {u.status === 'Active' ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => {
                                  setResetStaffUser(u);
                                  setNewResetPass('');
                                }}
                              >
                                <KeyRound size={12} /> Reset
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Persistent Action Footer with Inline Success Banner (Only for form tabs) */}
          {activeTab !== 'users' && (
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-app)' }}>
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
