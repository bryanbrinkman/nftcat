import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Pagination,
  SelectChangeEvent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  Sort as SortIcon, 
  FilterList as FilterIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon
} from '@mui/icons-material';
import Papa from 'papaparse';

interface NFT {
  Type: string;
  'Edt Size': string;
  'Mint Date': string;
  Platform: string;
  'Collection Name': string;
  'Collaborator/Special Type': string;
  Link: string;
  'Contract Hash': string;
  'Token Type': string;
  'TokenID Start': string;
  'Token ID End': string;
  'IPFS Image': string;
  'IPFS Json': string;
  Pinned: string;
  'Hosting Type': string;
}

type SortField = 'Collection Name' | 'Mint Date' | 'Platform' | 'Type';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

function App() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [collaboratorFilter, setCollaboratorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortField, setSortField] = useState<SortField>('Mint Date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load CSV data
    fetch('/Brinkman NFT Catalog - Sheet1 (4).csv')
      .then(response => response.text())
      .then(data => {
        Papa.parse(data, {
          header: true,
          complete: (results) => {
            setNfts(results.data as NFT[]);
            setFilteredNfts(results.data as NFT[]);
            setLoading(false);
          }
        });
      });
  }, []);

  useEffect(() => {
    let filtered = nfts;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft['Collection Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.Platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft['Collaborator/Special Type']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply platform filter
    if (platformFilter) {
      filtered = filtered.filter(nft => nft.Platform === platformFilter);
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(nft => nft.Type === typeFilter);
    }

    // Apply collaborator filter
    if (collaboratorFilter) {
      filtered = filtered.filter(nft => nft['Collaborator/Special Type'] === collaboratorFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortField === 'Mint Date') {
        // Convert dates to timestamps for proper sorting
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      // String comparison for other fields
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredNfts(filtered);
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, platformFilter, typeFilter, collaboratorFilter, nfts, sortField, sortOrder]);

  const platforms = [...new Set(nfts.map(nft => nft.Platform))].filter(Boolean);
  const types = [...new Set(nfts.map(nft => nft.Type))].filter(Boolean);
  const collaborators = [...new Set(nfts.map(nft => nft['Collaborator/Special Type']))].filter(Boolean);

  const getImageUrl = (nft: NFT) => {
    if (nft['IPFS Image']) {
      return `https://ipfs.io/ipfs/${nft['IPFS Image']}`;
    }
    return 'https://via.placeholder.com/300x300?text=No+Image';
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const paginatedNfts = filteredNfts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const pageCount = Math.ceil(filteredNfts.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm('');
    setPlatformFilter('');
    setTypeFilter('');
    setCollaboratorFilter('');
    setSortField('Mint Date');
    setSortOrder('desc');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, platform, type, or collaborator"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Tooltip title="Toggle Filters">
                <IconButton onClick={() => setShowFilters(!showFilters)} color="primary">
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Grid View">
                <IconButton 
                  onClick={() => setViewMode('grid')} 
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                >
                  <GridIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton 
                  onClick={() => setViewMode('list')} 
                  color={viewMode === 'list' ? 'primary' : 'default'}
                >
                  <ListIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {showFilters && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Platform</InputLabel>
                  <Select
                    value={platformFilter}
                    label="Platform"
                    onChange={(e) => setPlatformFilter(e.target.value)}
                  >
                    <MenuItem value="">All Platforms</MenuItem>
                    {platforms.map((platform) => (
                      <MenuItem key={platform} value={platform}>
                        {platform}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Type"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {types.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Collaborator</InputLabel>
                  <Select
                    value={collaboratorFilter}
                    label="Collaborator"
                    onChange={(e) => setCollaboratorFilter(e.target.value)}
                  >
                    <MenuItem value="">All Collaborators</MenuItem>
                    {collaborators.map((collaborator) => (
                      <MenuItem key={collaborator} value={collaborator}>
                        {collaborator}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box display="flex" alignItems="center" height="100%">
                  <Chip 
                    label="Clear Filters" 
                    onClick={clearFilters} 
                    color="primary" 
                    variant="outlined"
                    sx={{ width: '100%' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredNfts.length} NFTs
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`Sort: ${sortField}`} 
              icon={<SortIcon />} 
              onClick={() => handleSortChange('Collection Name')}
              color={sortField === 'Collection Name' ? 'primary' : 'default'}
            />
            <Chip 
              label={`Sort: ${sortField}`} 
              icon={<SortIcon />} 
              onClick={() => handleSortChange('Mint Date')}
              color={sortField === 'Mint Date' ? 'primary' : 'default'}
            />
            <Chip 
              label={`Sort: ${sortField}`} 
              icon={<SortIcon />} 
              onClick={() => handleSortChange('Platform')}
              color={sortField === 'Platform' ? 'primary' : 'default'}
            />
            <Chip 
              label={`Sort: ${sortField}`} 
              icon={<SortIcon />} 
              onClick={() => handleSortChange('Type')}
              color={sortField === 'Type' ? 'primary' : 'default'}
            />
          </Stack>
        </Box>
      </Box>

      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {paginatedNfts.map((nft, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={getImageUrl(nft)}
                  alt={nft['Collection Name'] || 'NFT'}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {nft['Collection Name'] || 'Untitled'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Platform: {nft.Platform}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {nft.Type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mint Date: {nft['Mint Date']}
                  </Typography>
                  {nft['Collaborator/Special Type'] && (
                    <Typography variant="body2" color="text.secondary">
                      Collaborator: {nft['Collaborator/Special Type']}
                    </Typography>
                  )}
                  {nft.Link && (
                    <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                      <a href={nft.Link} target="_blank" rel="noopener noreferrer">
                        View on Platform
                      </a>
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box>
          {paginatedNfts.map((nft, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <Grid container>
                <Grid item xs={12} md={3}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(nft)}
                    alt={nft['Collection Name'] || 'NFT'}
                    sx={{ objectFit: 'cover', height: '100%' }}
                  />
                </Grid>
                <Grid item xs={12} md={9}>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {nft['Collection Name'] || 'Untitled'}
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Platform: {nft.Platform}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Type: {nft.Type}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Mint Date: {nft['Mint Date']}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        {nft['Collaborator/Special Type'] && (
                          <Typography variant="body2" color="text.secondary">
                            Collaborator: {nft['Collaborator/Special Type']}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                    {nft.Link && (
                      <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                        <a href={nft.Link} target="_blank" rel="noopener noreferrer">
                          View on Platform
                        </a>
                      </Typography>
                    )}
                  </CardContent>
                </Grid>
              </Grid>
            </Card>
          ))}
        </Box>
      )}

      {pageCount > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={pageCount} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
          />
        </Box>
      )}
    </Container>
  );
}

export default App; 