import { useState, useEffect } from 'react';
import { HeaderBar } from "./components/HeaderBar";
import { FooterBar } from "./components/FooterBar";
import { MapArea } from "./components/MapArea";
import { MapAreaByCat } from "./components/MapAreaByCat";
import { MapAreaByDeliveryLocation } from "./components/MapAreaByDeliveryLocation";
import { StaticBlock } from "./components/StaticBlock";
import { LocationsTable } from "./components/LocationsTable";
import { Table } from "./components/Table";
import { Total } from "./components/Total";
import { loadData } from "./loadData";
import { Deliveries } from "./containers/deliveries";
import { Categories } from "./containers/categories";
import { Supplier } from './components/Supplier';
import { areaMappingReverse, groupByAge, allTotalGender, hideLoader, simulateClick } from "./utils";
import * as _ from 'lodash';
import "./App.css";
import { omit } from "lodash";


function App() {
  const [summary, setSummary] = useState({});
  const [selected, setSelected] = useState(null);
  const [totalAgeByGender, setTotalAgeByGender] = useState({});
  const [barState, setBarState] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedLocationMap, setSelectedLocationMap] = useState(null);
  const [selectedLocationCategoryMap, setSelectedLocationCategoryMap] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedFilterByAge, setSelectedFilterByAge] = useState(null);
  const [selectedCodeCategory, setSelectedCodeCategory] = useState(null);
  const [categoryRegionSelect, setCategoryRegionSelect] = useState(null);
  const [totalByCategory, setTotalByCategory] = useState(0);
  const [maxByCategory, setMaxByCategory] = useState(0);
  const [locationTableRef, setLocationTableRef] = useState(0);
  const [locationRegionSelect, setLocationRegionSelect] = useState(null);



  const resetFilter = () => {
    simulateClick(selected?.area);
    simulateClick(selectedAge?.fascia_anagrafica)
    setSelected(null);
    setSelectedCategory(summary.categories);
    setSelectedCodeCategory(null);
    setSelectedLocationCategoryMap(null);
    setCategoryRegionSelect(null);
    setSelectedLocation(null);
    setLocationRegionSelect(null);
  }

  const loadRect = (rect) => {
    setSelectedAge(rect)
    setTotalAgeByGender({ gen_m: rect?.sesso_maschile, gen_f: rect?.sesso_femminile });
  }

  const setTableFilteredVaccini = (currentRect) => {
    let vaccinAdministrationListReportByAge = summary.dataSomeVaxDetail.filter(el => (el.fascia_anagrafica.trim()) === (currentRect.fascia_anagrafica.trim()));
    var grouped = _.mapValues(_.groupBy(vaccinAdministrationListReportByAge, 'area'),
      z => _.sum(z.map(x => _.sum([x.sesso_maschile, x.sesso_femminile]))));
    let _summary = summary.deliverySummary;
    _summary = _summary.map((e) => {
      let x = omit(e, ['dosi_somministrate', 'percentuale_somministrazione', 'ultimo_aggiornamento']);
      let y = { dosi_somministrate: grouped[e.area] };
      let z = { percentuale_somministrazione: ((y.dosi_somministrate / x.dosi_consegnate) * 100).toFixed(1) }
      return { ...x, ...y, ...z };
    });
    setSelectedFilterByAge(_summary);
  }
  const handleRectClick = (currentRect) => {
    let currentRectExist = currentRect ? true : false;
    let selectedExist = selected ? true : false;
    if (!currentRectExist) {
      setBarState(summary.categoriesAndAges);
      setTotalAgeByGender(summary.gender);
      setSelectedFilterByAge(null);
      setSelectedAge(null)
      setSelected(null);
    }
    if (currentRectExist && selectedExist) {
      resetFilter();
      let currentRectDefault = summary?.categoriesAndAges.filter((e) => e?.fascia_anagrafica === currentRect?.fascia_anagrafica);
      setTableFilteredVaccini(currentRect);
      loadRect(currentRectDefault[0])
    }
    if (currentRectExist && !selectedExist) {
      setTableFilteredVaccini(currentRect);
      loadRect(currentRect);
    }
  }
  const handleHRectClick = (currentRect) => {
    if (currentRect) {
      setSelectedCodeCategory(currentRect?.code)
    } else {
      setSelectedCodeCategory(null)
    }
  }


  const handleCountryClickLocations = (countryIndex) => {
    setSelectedLocation(countryIndex);
  };

  const handleCountryClickCategories = (countryIndex) => {
    setSelectedCodeCategory(null)
    const area = summary.deliverySummary[countryIndex]?.area;
    const areaCode = areaMappingReverse[area];
    const data = summary.categoriesByRegions[areaCode];

    let _selected = summary.deliverySummary[countryIndex];
    setSelectedLocationCategoryMap(_selected);

    setTotalByCategory(
      countryIndex ? _selected.dosi_somministrate : summary.tot
    )
    setSelectedCategory(
      countryIndex ? data?.slice() || [] : summary.categories
    );
  };

  useEffect(() => {
    loadData().then((d) => {
      hideLoader();
      setSummary(d);
      setSelectedCategory(d.categories);
      setBarState(d.categoriesAndAges);
      setTotalAgeByGender(d.gender);
      setSelectedFilterByAge(null);
    });
  }, []);

  useEffect(() => {
    let totalSumm = 0;
    let maxSumm = 0;

    if (selectedCodeCategory) {
      setSelectedLocationCategoryMap(null)
    }
    if (!selectedLocationCategoryMap) {
      summary?.deliverySummary?.forEach(i => {
        Object.keys(i.byCategory).forEach(cat => {
          if (!selectedCodeCategory) {
            totalSumm = totalSumm + (i.byCategory[cat].length && i.byCategory[cat][0].total) || 0
            maxSumm = (i.byCategory[cat].length && i.byCategory[cat][0].total) > maxSumm ?
              (i.byCategory[cat].length && i.byCategory[cat][0].total) : maxSumm

          } else if (selectedCodeCategory && cat === selectedCodeCategory) {
            totalSumm = totalSumm + (i.byCategory[cat].length && i.byCategory[cat][0].total) || 0
            maxSumm = (i.byCategory[cat].length && i.byCategory[cat][0].total) > maxSumm ?
              (i.byCategory[cat].length && i.byCategory[cat][0].total) : maxSumm
          }
        })
      });
      setMaxByCategory(maxSumm)
      setTotalByCategory(totalSumm)
    }
    // eslint-disable-next-line
  }, [selectedCodeCategory, summary, totalByCategory])

  return (
    <div>
      <HeaderBar />
      <div className="container">
        <div className="row">
          <div className="col-12 d-flex justify-content-center">

            <Total className="mb-3" summary={{ ...summary }} />

          </div>
        </div>
        <div style={{ padding: 20 }}></div>

        <div className="row position-powerbi" style={{ backgroundColor: '#17324D' }} >
          <div className="col-12">
            <div className="p-4 position-relative d-flex justify-content-center  h-100" style={{ backgroundColor: '#17324D', minHeight: 240 }}>
              <div className="d-none  d-lg-block" style={{ height: 100, position: 'absolute', left: '20px', top: '20px' }}>
                <img src="group_person.svg" alt="Logo" className="img-fluid" />
              </div>
              <div className="  d-none  d-lg-block position-absolute center-logo">
                <img src="logo.png" width="80" height="80" alt="Logo" />
              </div>
              <div className="text-white w-100" style={{ padding: 20 }}>

                <div className="w-100  h-100 align-items-center d-flex justify-content-center text-right">
                  <h4 style={{ marginRight: 10 }}>Totale<br></br> persone vaccinate</h4>
                  <div className="d-flex justify-content-center text-right align-items-center border-pink"> {summary?.totalDoses?.seconda_dose?.toLocaleString('it')}</div>
                </div>
                <div className="text-center position-relative" style={{ top: -10 }}>(a cui sono state somministrate la prima e la seconda dose di vaccino)</div>
              </div>

            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div
              className="text-center font-22"
            >
              <StaticBlock
                classes="text-black text-uppercase font-weight-bold"
                text={`LA SOMMINISTRAZIONE DI ${summary?.totalDoses?.vax_somministrati}  DOSI DI VACCINO SU TUTTO IL TERRITORIO E' INIZIATA IL 31 DICEMBRE`}
              />
            </div>
          </div>
        </div>

        <Deliveries
          data={summary}
        />
        <Categories
          data={summary}
        />
        <Supplier data={summary}></Supplier>

        <div className="row ">
          <div
            className="col-12 d-flex justify-content-center align-items-center p-5 bg-title-plot">
            <img src="logo.png" width="86" height="86" alt="Logo" className="img-fluid" style={{ zIndex: 10 }} />
            <h3 className="text-center">Punti di somministrazione per regione</h3>
          </div>
          <div className="col-12 col-md-12 h-100 p-0">
            <div className="mb-5  d-lg-none " style={{
              position: 'relative',
              background: '#013366',

            }}>
              <div className="text-white w-100">
                <div className="w-100  h-100 d-flex justify-content-start pt-5 pl-4">
                  <h5>Punti di somministrazione per regione</h5>
                </div>
                <div className="w-100  h-100 d-flex justify-content-start pl-4">
                  <p className="numeri_box">{locationTableRef}
                  </p>
                </div>
                <div className="col-12 d-flex justify-content-end  pb-2">
                  <img alt="reset-plot" src="reset_white.png" onClick={resetFilter} height={35} />
                </div>
              </div>
            </div>

            <div className="col-3 col-md-3 h-100 d-none d-lg-block">
              <div style={{
                position: 'relative',
                // width: 300,
                // height: 180,
                background: '#17324D',
                top: -90,
                left: 40
              }}>
                <div className="text-white w-100">
                  <div className="w-100  h-100 d-flex justify-content-start pt-5 pl-4">
                    <h5>Totale punti di<br></br>somministrazione</h5>
                  </div>
                  <div className="w-100  h-100 d-flex justify-content-start pl-4">
                    <p className="numeri_box">{locationTableRef}
                    </p>
                  </div>
                  <div className="col-12 d-flex justify-content-end  pb-2">
                    <img alt="reset-white" src="reset_white.png" onClick={resetFilter} height={35} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 pt-5">
            <div className="p-4 position-relative d-lg-none">
              <div className="w-100 h-100 d-flex justify-content-start pr-5">
                <img src="logo.png" width="35" height="35" alt="Logo" />
                <h5 className="pl-3 pl-sm-1">Punti di<br /> somministrazione <br /> per regione</h5>
              </div>
            </div>
            <div className="p-4 position-relative d-none d-lg-block" style={{ left: '300px', top: '190px' }}>
              <div className="w-100 h-100 d-flex justify-content-start pr-5">
                <img src="logo.png" width="35" height="35" alt="Logo" />
                <h5 className="pl-3 pl-sm-1">Punti di<br /> somministrazione <br /> per regione</h5>
              </div>
            </div>
            <MapAreaByDeliveryLocation
              summary={{ ...summary }}
              handleCountryClick={handleCountryClickLocations}
              className="w-100 h-100"
              setLocationRegionSelect={setLocationRegionSelect}
              locationRegionSelect={locationRegionSelect}
            />
          </div>
          <div className="col-12 col-md-6 pt-3 pl-3">
            <LocationsTable
              summary={{ ...summary }}
              selected={selectedLocation}
              className="mr-5 h-100"
              setLocationTableRef={setLocationTableRef}
            />
          </div>

        </div>
        <div className="row">
          <div className="col-12 text-center pt-5 pb-3">
            I dati visualizzati sono disponibili all'indirizzo{" "}
            <a href="https://github.com/italia/covid19-opendata-vaccini">
              https://github.com/italia/covid19-opendata-vaccini
        </a>
          </div>
        </div>
      </div>
      <FooterBar />

    </div>
  );
}

export default App;
