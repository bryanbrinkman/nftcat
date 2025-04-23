import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ERC721 ABI for basic NFT functions
const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

interface NFT {
  tokenId: string;
  name: string;
  image: string;
  description: string;
  attributes?: {
    trait_type: string;
    value: string;
  }[];
  collectionName?: string;
  collectionSymbol?: string;
  lowestPrice?: number;
  currency?: string;
}

interface NFTViewerProps {
  contractAddress: string;
  walletAddress: string;
  openseaApiKey?: string;
}

const NFTViewer: React.FC<NFTViewerProps> = ({ 
  contractAddress, 
  walletAddress,
  openseaApiKey = import.meta.env.VITE_OPENSEA_API_KEY 
}) => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'tokenId' | 'collection' | 'price'>('tokenId');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    fetchNFTs();
  }, [contractAddress, walletAddress]);

  const fetchOpenSeaPrice = async (tokenId: string): Promise<{ price: number; currency: string } | null> => {
    try {
      const response = await fetch(
        `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/`,
        {
          headers: {
            'X-API-KEY': openseaApiKey || '',
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch OpenSea data');
      }

      const data = await response.json();
      
      // Get the lowest price from all listings
      const lowestPrice = data.sell_orders?.[0]?.current_price 
        ? parseFloat(data.sell_orders[0].current_price) / Math.pow(10, data.sell_orders[0].payment_token_contract.decimals)
        : null;

      return lowestPrice ? {
        price: lowestPrice,
        currency: data.sell_orders[0].payment_token_contract.symbol
      } : null;
    } catch (error) {
      console.error('Error fetching OpenSea price:', error);
      return null;
    }
  };

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Connect to Ethereum network (using Infura or similar provider)
      const provider = new ethers.providers.JsonRpcProvider(
        'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'
      );

      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        ERC721_ABI,
        provider
      );

      // Get collection info
      const collectionName = await contract.name();
      const collectionSymbol = await contract.symbol();

      // Get balance of NFTs
      const balance = await contract.balanceOf(walletAddress);
      
      // Fetch all NFTs
      const nftPromises = [];
      for (let i = 0; i < balance.toNumber(); i++) {
        nftPromises.push(fetchNFTMetadata(contract, i, collectionName, collectionSymbol));
      }

      const nftResults = await Promise.all(nftPromises);
      const validNFTs = nftResults.filter(nft => nft !== null) as NFT[];

      // Fetch prices for all NFTs
      setPriceLoading(true);
      const nftsWithPrices = await Promise.all(
        validNFTs.map(async (nft) => {
          const priceData = await fetchOpenSeaPrice(nft.tokenId);
          return {
            ...nft,
            lowestPrice: priceData?.price,
            currency: priceData?.currency
          };
        })
      );

      setNfts(nftsWithPrices);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setError('Failed to fetch NFTs. Please check your contract address and wallet address.');
    } finally {
      setLoading(false);
      setPriceLoading(false);
    }
  };

  const fetchNFTMetadata = async (
    contract: ethers.Contract,
    index: number,
    collectionName: string,
    collectionSymbol: string
  ): Promise<NFT | null> => {
    try {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, index);
      const tokenURI = await contract.tokenURI(tokenId);
      
      // Fetch metadata from IPFS or HTTP URL
      const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
      const metadata = await response.json();

      return {
        tokenId: tokenId.toString(),
        name: metadata.name || `#${tokenId}`,
        image: metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
        description: metadata.description || '',
        attributes: metadata.attributes,
        collectionName,
        collectionSymbol
      };
    } catch (error) {
      console.error(`Error fetching NFT ${index}:`, error);
      return null;
    }
  };

  const filteredAndSortedNFTs = [...nfts]
    .filter(nft => 
      nft.name.toLowerCase().includes(filter.toLowerCase()) ||
      nft.description.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'collection':
          return (a.collectionName || '').localeCompare(b.collectionName || '');
        case 'price':
          // Sort by price, putting NFTs with no price at the end
          if (!a.lowestPrice && !b.lowestPrice) return 0;
          if (!a.lowestPrice) return 1;
          if (!b.lowestPrice) return -1;
          return a.lowestPrice - b.lowestPrice;
        default:
          return parseInt(a.tokenId) - parseInt(b.tokenId);
      }
    });

  const formatPrice = (price: number | undefined, currency: string | undefined) => {
    if (price === undefined || currency === undefined) return 'Not for sale';
    return `${price.toFixed(3)} ${currency}`;
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search NFTs..."
            className="px-4 py-2 rounded-lg border border-gray-300 w-full md:w-64"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select
            className="px-4 py-2 rounded-lg border border-gray-300"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'tokenId' | 'collection' | 'price')}
          >
            <option value="tokenId">Sort by Token ID</option>
            <option value="name">Sort by Name</option>
            <option value="collection">Sort by Collection</option>
            <option value="price">Sort by Price (Low to High)</option>
          </select>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading || priceLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredAndSortedNFTs.map((nft) => (
            <div
              key={nft.tokenId}
              className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={() => setSelectedNFT(nft)}
            >
              <img
                src={nft.image}
                alt={nft.name}
                className={`object-cover ${
                  viewMode === 'list' ? 'w-48 h-48' : 'w-full h-48'
                }`}
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{nft.name}</h3>
                <p className="text-gray-600 mb-2">{nft.description}</p>
                <p className="text-sm text-gray-500">Token ID: {nft.tokenId}</p>
                {nft.collectionName && (
                  <p className="text-sm text-gray-500">
                    Collection: {nft.collectionName} ({nft.collectionSymbol})
                  </p>
                )}
                <p className="text-sm font-medium text-green-600 mt-2">
                  {formatPrice(nft.lowestPrice, nft.currency)}
                </p>
                {nft.attributes && (
                  <div className="mt-2">
                    {nft.attributes.map((attr, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{attr.trait_type}:</span>{' '}
                        {attr.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNFT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedNFT.name}</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedNFT(null)}
              >
                ✕
              </button>
            </div>
            <img
              src={selectedNFT.image}
              alt={selectedNFT.name}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <p className="text-gray-600 mb-4">{selectedNFT.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Token ID</p>
                <p className="font-medium">{selectedNFT.tokenId}</p>
              </div>
              {selectedNFT.collectionName && (
                <div>
                  <p className="text-sm text-gray-500">Collection</p>
                  <p className="font-medium">
                    {selectedNFT.collectionName} ({selectedNFT.collectionSymbol})
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium text-green-600">
                  {formatPrice(selectedNFT.lowestPrice, selectedNFT.currency)}
                </p>
              </div>
            </div>
            {selectedNFT.attributes && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Attributes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedNFT.attributes.map((attr, index) => (
                    <div key={index} className="bg-gray-100 p-2 rounded">
                      <p className="text-sm text-gray-500">{attr.trait_type}</p>
                      <p className="font-medium">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTViewer; 