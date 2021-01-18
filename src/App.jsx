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
import { BarChart } from "./components/BarChart";
import { HBarChart } from "./components/HBarChart";
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

  const handleCountryClick = (countryIndex) => {
    let _selected = summary.deliverySummary[countryIndex];

    setSelected({ ..._selected });
    setSelectedAge(null);
    setSelectedFilterByAge(null);
    setSelectedLocationMap(_selected);

    if (countryIndex || countryIndex === 0) {
      let vaccinAdministrationListReportByArea = summary.dataSomeVaxDetail.filter(el => el?.area?.trim() === _selected.area?.trim());
      setBarState(groupByAge(vaccinAdministrationListReportByArea));
      setTotalAgeByGender(allTotalGender(groupByAge(vaccinAdministrationListReportByArea)));
    } else {
      setBarState(summary.categoriesAndAges);
      setTotalAgeByGender(summary.gender);
    }

  };

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
        <div className="row bg-title-plot">
          <div className="col-12 col-md-6 d-flex justify-content-center align-items-center">
            {/* <StaticBlock
              classes="bg-primary text-white h-100"
              text="Il 27 dicembre sono state consegnate 9.750 dosi di vaccino, interamente somministrate."
            /> */}
            <div style={{ marginRight: 10 }}>
              <img src="dose.png" height="70" alt="Prima somministrazione" />
            </div>
            <div className="border-blu d-flex align-items-center">
              <h1 className="font-weight-light inline">1.139.445</h1>
            </div>

          </div>
          <div className="col-12 col-md-6 d-flex justify-content-center align-items-center">
            <div style={{ marginRight: 10 }}>
              <img src="dosi.png" height="70" alt="Seconda somministrazione" />
            </div>
            <div className="border-blu d-flex align-items-center">
              <h1 className="font-weight-light inline">2.189</h1>
            </div>

            {/* <StaticBlock
              classes="bg-primary text-white h-100"
              text="Dal 30 dicembre al 07 gennaio sono state consegnate 908.700 dosi di vaccino. L'11 – 12  gennaio sono state consegnate  488.475  dosi di vaccino."
            /> */}
          </div>
        </div>

        <div className="row position-powerbi">
          <div className="col-12">
            <div className="p-4 position-relative d-flex justify-content-center " style={{ backgroundColor: '#17324D', minHeight: 240 }}>
              <div style={{ height: 100, position: 'absolute', left: '20px', top: '20px' }}>
                <img src="group_person.svg" alt="Logo" className="img-fluid" />
              </div>
              <div className="  position-absolute center-logo">
                <img src="logo.png" width="80" height="80" alt="Logo" />
              </div>
              <div className="text-white w-100">

                <div className="w-100  h-100 align-items-center d-flex justify-content-center text-right">
                  <h3 style={{ marginRight: 10 }}>Totale<br></br> persone vaccinate</h3>
                  <div className="d-flex justify-content-center text-right align-items-center border-pink"> 3000</div>

                </div>

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
                text="Le somministrazioni delle 1.397.175 dosi di vaccino su tutto il territorio sono iniziate il 31 dicembre."
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12 d-flex justify-content-end">
            <img alt="reset" src="reset.png" onClick={resetFilter} />
          </div>

        </div>

        <div className="row" style={{ backgroundColor: '#F8FBFE' }}>
          <div className="col-12 col-lg-5 h-100 order-md-2 order-lg-1 ">
            <div className="container-info d-none d-sm-none d-md-flex d-lg-flex" >
              <span data-toggle="tooltip" title="% somministrazioni su dosi consegnate" className="circle-info">i</span>
            </div>
            <Table
              summaryFilter={selectedFilterByAge}
              summary={{ ...summary }}
              selected={selected}
              className="mr-5 h-100"
            />
            <div className="col-12 col-md-6 align-items-start testo-info-campania d-lg-none d-md-none d-sm-flex">
              Le quantità consegnate sono calcolate considerando, al momento, cinque dosi per fiala. Pertanto, eventuali valori percentuali superiori a 100 evidenziano l'utilizzo della sesta dose.
          </div>
          </div>

          <div className="col-12 col-lg-7 order-md-1 order-lg-2">
            <div className="p-4 position-relative d-lg-none">

              <div className="w-100 h-100 d-flex justify-content-start pr-5">
                <img src="logo.png" width="35" height="35" alt="Logo" />

                <h5 className="pl-3 pl-sm-1">Distribuzione somministrazioni<br /> rispetto alle consegne</h5>

              </div>


            </div>

            <div className="p-5 d-none d-lg-block">

              <div className="d-flex justify-content-end"
                style={{
                  position: 'absolute ',
                  top: 150,
                  right: 50
                }}
              >
                <img src="logo.png" width="35" height="35" alt="Logo"
                  style={{
                    position: 'absolute',
                    top: -10
                  }}
                />

                <h5 className="pl-3 pl-sm-1 text-right">
                  <span data-toggle="tooltip" title="Nel grafico è rappresentato il tasso di somministrazione, 
                ovvero il rapporto tra le somministrazioni e le dosi consegnate (%)" className="circle-info"
                    style={{
                      position: 'relative',
                      right: 23,
                      top: 25
                    }}
                  >i</span>
                  Distribuzione somministrazioni<br /> rispetto alle consegne</h5>
              </div>


            </div>
            <MapArea
              summaryFilter={selectedFilterByAge}
              summary={{ ...summary }}
              selected={selectedLocationMap}
              handleCountryClick={handleCountryClick}
              className="ml-5 w-100 h-100"
            />
            <div className="p-4 position-relative">
              <div className="text-black w-100">
                <div className="w-100 h-100 d-flex justify-content-start ">
                  <img src="logo.png" width="45" height="45" alt="Logo" className="mt-3" />
                  <span className="font-50 pl-3" >{_.sum([totalAgeByGender?.gen_m, totalAgeByGender?.gen_f]) ? _.sum([totalAgeByGender?.gen_m, totalAgeByGender?.gen_f]).toLocaleString('it') : 0}</span>

                </div>

                <div className="w-100  h-100 d-flex justify-content-start">
                  <h5>Totale somministrazioni</h5>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="row position-powerbi" style={{ backgroundColor: '#F8FBFE' }}>
          <div className="col-12 col-md-6 align-items-end testo-info-campania d-none d-sm-none d-md-flex d-lg-flex">
            Le quantità consegnate sono calcolate considerando, al momento, cinque dosi per fiala. Pertanto, eventuali valori percentuali superiori a 100 evidenziano l'utilizzo della sesta dose.
          </div>
          <div className="col-12 col-md-6  position-relative" >
            <div className="bg-gradient-bar"></div>
            <div className="row">
              <div className="col-6 d-flex align-items-baseline">
                <img src="user_f.png" alt="users" width="75px" />
                <span className="text-center font-weight-light text-white">
                  <h3 className="total_gender">{totalAgeByGender?.gen_f?.toLocaleString('it')}</h3>
                </span>
              </div>
              <div className="col-6  d-flex align-items-baseline">
                <img src="user_m.png" alt="users" width="75px" />
                <span className="text-center font-weight-light text-white">
                  <h3 className="total_gender">{totalAgeByGender?.gen_m?.toLocaleString('it')}</h3>
                </span>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-5" style={{ backgroundColor: '#17324D' }}>
            <div className="p-4 position-relative">
              <div style={{ height: 100 }}>
                <img src="group_person.svg" alt="Logo" className="img-fluid" />
              </div>
              <div className="text-white w-100">
                <div className="w-100 h-100 d-flex justify-content-end">
                  <img src="logo.png" width="40" height="40" alt="Logo" />
                </div>
                <div className="w-100  h-100 d-flex justify-content-end text-right">
                  <h3>Somministrazioni<br></br> per fasce di età</h3>

                </div>
              </div>

            </div>
          </div>
          <div className="col-12  col-md-7" style={{
            backgroundColor: '#17324D'
          }}>
            <BarChart
              title=""
              xtitle="Fascia d'età"
              ytitle=""
              width="800"
              handleRectClick={handleRectClick}
              height="300"
              selected={selectedAge}
              property={{ xprop: "fascia_anagrafica", yprop: "totale" }}
              data={[...barState]}
            />
          </div>
        </div>

        <div className="row ">
          <div
            className="col-12  d-flex justify-content-center align-items-center p-5 bg-title-plot">
            <img src="logo.png" width="86" height="86" alt="Logo" className="img-fluid" style={{ zIndex: 10 }} />
            <h3 className="text-center">somministrazioni per categoria</h3>
          </div>
          <div className="col-12 col-md-12 h-100  ">
            <div className="mb-5  d-lg-none " style={{
              position: 'relative',
              background: '#013366',

            }}>
              <div className="text-white w-100">
                <div className="w-100  h-100 d-flex justify-content-start pt-5 pl-4">
                  <h5>Totale<br></br>somministrazioni</h5>
                </div>
                <div className="w-100  h-100 d-flex justify-content-start pl-4">
                  <p className="numeri_box">{(!selectedCodeCategory && !selectedLocationCategoryMap)
                    ? summary.tot?.toLocaleString('it')
                    : totalByCategory?.toLocaleString('it')}
                  </p>
                </div>
                <div className="col-12 d-flex justify-content-end  pb-2">
                  <img alt="reset-plot2" src="reset_white.png" onClick={resetFilter} height={35} />
                </div>
              </div>
            </div>

            <div className="col-3 col-md-3 h-100 d-none d-lg-block">
              <div style={{
                position: 'relative',
                background: '#17324D',
                top: -90,
                left: 105
              }}>
                <div className="text-white w-100">
                  <div className="w-100  h-100 d-flex justify-content-start pt-3 pl-4">
                    <h5>Totale<br></br>somministrazioni</h5>
                  </div>
                  <div className="w-100  h-100 d-flex justify-content-start pl-4">
                    <p className="numeri_box">{(!selectedCodeCategory && !selectedLocationCategoryMap)
                      ? summary.tot?.toLocaleString('it')
                      : totalByCategory?.toLocaleString('it')}
                    </p>
                  </div>
                  <div className="col-12 d-flex justify-content-end  pb-2">
                    <img alt="Reset" src="reset_white.png" onClick={resetFilter} height={35} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 h-100">
            <HBarChart
              title=""
              xtitle="Somministrazioni per categoria"
              handleRectClick={handleHRectClick}
              ytitle=""
              width="220"
              height="260"
              property={{ xprop: "name", yprop: "total" }}
              data={selectedCategory?.slice() || []}
              selectedCodeCategory={selectedCodeCategory}
            />
          </div>
          <div className="col-12 col-md-6 h-100">
            <div className="p-4 position-relative d-lg-none">
              <div className="w-100 h-100 d-flex justify-content-start pr-5">
                <img src="logo.png" width="35" height="35" alt="Logo" />
                <h5 className="pl-3 pl-sm-1">Vaccinazioni<br /> per regione</h5>
              </div>
            </div>
            <div className="p-4 position-relative d-none d-lg-block" style={{ left: '300px', top: '190px' }}>
              <div className="w-100 h-100 d-flex justify-content-start pr-5">
                <img src="logo.png" width="35" height="35" alt="Logo" />
                <h5 className="pl-3 pl-sm-1">Somministrazioni<br /> per regione</h5>
              </div>
            </div>
            <MapAreaByCat
              summary={{ ...summary }}
              selected={selectedLocationCategoryMap}
              handleCountryClick={handleCountryClickCategories}
              maxByCategory={maxByCategory}
              selectedCodeCategory={selectedCodeCategory}
              setCategoryRegionSelect={setCategoryRegionSelect}
              categoryRegionSelect={categoryRegionSelect}
              className="w-100 h-100"
            />
          </div>
        </div>

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
