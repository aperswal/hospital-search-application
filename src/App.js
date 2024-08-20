import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Box, Tabs, Tab } from '@mui/material';
import { LoadScript } from '@react-google-maps/api';
import SearchBar from './components/SearchBar';
import GoogleMapsSearch from './components/GoogleMapsSearch';
import HospitalList from './components/HospitalList';
import InsuranceSearchForm from './components/InsuranceSearchForm';
import InsurancePlanList from './components/InsurancePlanList';
import InsuranceFilterComponent from './components/InsuranceFilterComponent';
import HospitalFilterComponent from './components/HospitalFilterComponent';

const libraries = ['places'];

function App() {
  const [hospitals, setHospitals] = useState(null);
  const [filteredHospitals, setFilteredHospitals] = useState(null);
  const [insurancePlans, setInsurancePlans] = useState(null);
  const [filteredInsurancePlans, setFilteredInsurancePlans] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const [insuranceFilterOptions, setInsuranceFilterOptions] = useState({
    issuers: [],
    planTypes: [],
    metalLevels: []
  });

  const [hospitalFilterOptions, setHospitalFilterOptions] = useState({
    emergencyServices: [],
    hospitalTypes: [],
    hospitalOwnerships: []
  });

  useEffect(() => {
    if (insurancePlans) {
      const issuers = [...new Set(insurancePlans.map(plan => plan.issuer.name))];
      const planTypes = [...new Set(insurancePlans.map(plan => plan.type))];
      const metalLevels = [...new Set(insurancePlans.map(plan => plan.metal_level))];
      setInsuranceFilterOptions({ issuers, planTypes, metalLevels });
    }
  }, [insurancePlans]);

  useEffect(() => {
    if (hospitals) {
      const emergencyServices = [...new Set(hospitals.map(hospital => hospital.emergencyServices))];
      const hospitalTypes = [...new Set(hospitals.map(hospital => hospital.hospitalType))];
      const hospitalOwnerships = [...new Set(hospitals.map(hospital => hospital.hospitalOwnership))];
      setHospitalFilterOptions({ emergencyServices, hospitalTypes, hospitalOwnerships });
    }
  }, [hospitals]);

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/hospitals?query=${query}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHospitals(data);
      setFilteredHospitals(data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setError('An error occurred while fetching hospitals. Please try again.');
      setHospitals(null);
      setFilteredHospitals(null);
    }
    setLoading(false);
  };

  const handleRadiusSearch = async ({ address, radius }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/hospitals/radius?address=${encodeURIComponent(address)}&radius=${radius}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHospitals(data);
      setFilteredHospitals(data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setError('An error occurred while fetching hospitals. Please try again.');
      setHospitals(null);
      setFilteredHospitals(null);
    }
    setLoading(false);
  };

  const handleInsuranceSearch = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/insurance-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setInsurancePlans(data.plans);
      setFilteredInsurancePlans(data.plans);
    } catch (error) {
      console.error('Error fetching insurance plans:', error);
      setError('An error occurred while fetching insurance plans. Please try again.');
      setInsurancePlans(null);
      setFilteredInsurancePlans(null);
    }
    setLoading(false);
  };

  const handleInsuranceFilterChange = (filters) => {
    const filtered = insurancePlans.filter(plan => {
      return (
        (filters.metalLevels.length === 0 || filters.metalLevels.includes(plan.metal_level)) &&
        (filters.planTypes.length === 0 || filters.planTypes.includes(plan.type)) &&
        (filters.issuers.length === 0 || filters.issuers.includes(plan.issuer.name)) &&
        plan.premium >= filters.premium[0] && plan.premium <= filters.premium[1] &&
        plan.deductibles[0].amount >= filters.deductible[0] && plan.deductibles[0].amount <= filters.deductible[1] &&
        (!filters.hsaEligible || plan.hsa_eligible) &&
        (!filters.hasNationalNetwork || plan.has_national_network)
      );
    });
    setFilteredInsurancePlans(filtered);
  };

  const handleHospitalFilterChange = (filters) => {
    const filtered = hospitals.filter(hospital => {
      return (
        (filters.emergencyServices.length === 0 || filters.emergencyServices.includes(hospital.emergencyServices)) &&
        (filters.hospitalTypes.length === 0 || filters.hospitalTypes.includes(hospital.hospitalType)) &&
        (filters.hospitalOwnerships.length === 0 || filters.hospitalOwnerships.includes(hospital.hospitalOwnership))
      );
    });
    setFilteredHospitals(filtered);
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_API_KEY}
      libraries={libraries}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 4, mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Healthcare Search
          </Typography>
        </Box>
        <Box sx={{ mb: 4 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered>
            <Tab label="Hospital Search" />
            <Tab label="Insurance Search" />
          </Tabs>
        </Box>
        {activeTab === 0 && (
          <>
            <Box sx={{ mb: 4 }}>
              <Tabs value={searchType} onChange={(e, newValue) => setSearchType(newValue)} centered>
                <Tab label="Search by Name" />
                <Tab label="Search by Address" />
              </Tabs>
            </Box>
            <Box sx={{ mt: 4 }}>
              {searchType === 0 ? (
                <SearchBar onSearch={handleSearch} />
              ) : (
                <GoogleMapsSearch onSearch={handleRadiusSearch} />
              )}
            </Box>
            {hospitals && (
              <HospitalFilterComponent
                onFilterChange={handleHospitalFilterChange}
                filterOptions={hospitalFilterOptions}
              />
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>
                {error}
              </Typography>
            )}
            {filteredHospitals && <HospitalList hospitals={filteredHospitals} />}
          </>
        )}
        {activeTab === 1 && (
          <>
            <InsuranceSearchForm onSubmit={handleInsuranceSearch} />
            {insurancePlans && (
              <InsuranceFilterComponent
                onFilterChange={handleInsuranceFilterChange}
                filterOptions={insuranceFilterOptions}
              />
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>
                {error}
              </Typography>
            )}
            {filteredInsurancePlans && <InsurancePlanList plans={filteredInsurancePlans} />}
          </>
        )}
      </Container>
    </LoadScript>
  );
}

export default App;