import React, { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import axios from 'axios';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/saga-blue/theme.css';
import './App.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [globalSelectedArtworks, setGlobalSelectedArtworks] = useState<Artwork[]>([]);
  const [currentPageSelections, setCurrentPageSelections] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rows] = useState(12);
  const [customRowCount, setCustomRowCount] = useState(0);
  const [floatingBoxVisible, setFloatingBoxVisible] = useState(false);

  const fetchArtworks = async (pageNumber: number, rowsPerPage: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${pageNumber}&limit=${rowsPerPage}`);
      const fetchedArtworks = response.data.data;
      const totalRecords = response.data.pagination.total;

      const currentPageSelection = fetchedArtworks.filter((artwork: Artwork) =>
        globalSelectedArtworks.some(selected => selected.id === artwork.id)
      );
      setArtworks(fetchedArtworks);
      setCurrentPageSelections(currentPageSelection);
      setTotalRecords(totalRecords);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(page, rows);
  }, [page, rows]);

  const onPageChange = (event: any) => {
    setPage(event.page + 1); // PrimeReact uses zero-based page indexing
  };

  const onRowSelectChange = (e: any) => {
    const newPageSelection = e.value;
    const updatedGlobalSelections = globalSelectedArtworks
      .filter(selected => !artworks.some(artwork => artwork.id === selected.id))
      .concat(newPageSelection);

    setCurrentPageSelections(newPageSelection);
    setGlobalSelectedArtworks(updatedGlobalSelections);
  };

  const toggleFloatingBox = () => {
    setFloatingBoxVisible(!floatingBoxVisible);
  };

  const handleCustomRowCount = async () => {
    const selectedIds = globalSelectedArtworks.map(a => a.id);
    const additionalSelections: Artwork[] = [];

    let currentPage = 1;
    let totalSelected = 0;

    while (totalSelected < customRowCount && totalSelected < totalRecords) {
      const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${currentPage}&limit=${rows}`);
      const artworksToSelect = response.data.data;

      for (const artwork of artworksToSelect) {
        if (!selectedIds.includes(artwork.id)) {
          additionalSelections.push(artwork);
          selectedIds.push(artwork.id);
          totalSelected++;
        }
        if (totalSelected >= customRowCount) break;
      }

      currentPage++;
    }

    const updatedGlobalSelections = [...globalSelectedArtworks, ...additionalSelections];

    setGlobalSelectedArtworks(updatedGlobalSelections);

    await fetchArtworks(page, rows);

    const updatedPageSelections = artworks.filter(artwork =>
      updatedGlobalSelections.some(selected => selected.id === artwork.id)
    );

    setCurrentPageSelections(updatedPageSelections);
    setFloatingBoxVisible(false);
  };

  const resetSelections = () => {
    setGlobalSelectedArtworks([]);
    setCurrentPageSelections([]);
  };

  // const rowNumberTemplate = (options: { rowIndex: number }) => {
  //   return (page - 1) * rows + options.rowIndex + 1; // Removed rowData since it's not used
  // };

  return (
    <div className="App">
      <h2>Artworks</h2>

      <DataTable
        value={artworks}
        paginator
        rows={rows}
        totalRecords={totalRecords}
        lazy
        loading={loading}
        onPage={onPageChange}
        selection={currentPageSelections}
        onSelectionChange={onRowSelectChange}
        dataKey="id"
        selectionMode="checkbox"
        header={
          <div className="header-row">
            <div className="header-select-all">
              <Checkbox
                onChange={toggleFloatingBox}
                checked={floatingBoxVisible}
                tooltip="Select custom rows"
              />
              {floatingBoxVisible && (
                <div className="floating-box">
                  <InputNumber
                    value={customRowCount}
                    onValueChange={(e) => setCustomRowCount(e.value ?? 0)}
                    placeholder="Enter number of rows"
                  />
                  <Button label="Apply" onClick={handleCustomRowCount} />
                  <Button label="Reset" onClick={resetSelections} className="p-button-danger" />
                </div>
              )}
            </div>
          </div>
        }
      >
        {/* <Column
          field="count"
          header="Row Number"
          body={rowNumberTemplate} // Now only passing options, not rowData
        /> */}
        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Origin"></Column>
        <Column field="artist_display" header="Artist"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Start Date"></Column>
        <Column field="date_end" header="End Date"></Column>
        <Column
          header="Selected Rows Count"
          body={() => globalSelectedArtworks.length}
        />
      </DataTable>
    </div>
  );
};

export default App;
