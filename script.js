
const SLIDER = document.getElementById("year-slider");
const YEAR_LABEL = document.getElementById("year-label");
const COUNTRY_LABEL = document.getElementById("country-label");
const SORT_BUTTON = document.querySelector(".data-button");
const DROPDOWN_CONTENT = document.querySelector(".dropdown-content");
const CURRENT_SORT = document.querySelector(".current-data");
const backgroundColor = "rgba(8, 81, 156, 0.2)";

let currentData = "export";
let selectedYear = 2022; // Set the default year
let clickedCountry = "croatia";

//  SVG dimenzije
const width = window.innerWidth * 0.5;
const height = window.innerHeight;

//  map projection
const projection = d3
  .geoMercator()
  .center([10, 55])
  .translate([width / 2, height / 2])
  .scale([width / 1.3]);

const path = d3.geoPath().projection(projection);

// kreiranje SVGa
const svg = d3
  .select("#container")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background-color", backgroundColor);

// tooltip
const tooltip = svg
  .append("g")
  .attr("class", "tooltip")
  .style("display", "none");

tooltip
  .append("rect")
  .attr("width", 100)
  .attr("height", 20)
  .attr("fill", "white");

tooltip
  .append("text")
  .attr("x", 50)
  .attr("y", 10)
  .attr("dy", "0.35em")
  .style("text-anchor", "middle")
  .style("font-size", "12px");

const zoomGroup = svg.append("g");

// listeneri za interakcije
SLIDER.addEventListener("input", handleSliderInput);
SORT_BUTTON.addEventListener("click", toggleDropdown);
DROPDOWN_CONTENT.addEventListener("click", handleDropdownClick);

// GeoJSON data
d3.json("europe_features.json").then(function (json) {
    countries = zoomGroup
    .selectAll("path")
    .data(json.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("stroke", "rgba(8, 81, 156, 0.9)")
    .attr("fill", "rgba(8, 81, 156, 0.6)")
    .on("click", handleCountryClick)
    .on("mouseover", handleCountryMouseOver)
    .on("mouseout", handleCountryMouseOut);

  // zumiranje
  const zoom = d3.zoom().on("zoom", handleZoom);
  svg.call(zoom);

  // pocetno iscrtavanje grafa
  drawGraph();
});


function handleSliderInput() {
  selectedYear = +this.value;
  YEAR_LABEL.textContent = selectedYear;
  drawGraph();
}

function toggleDropdown() {
  DROPDOWN_CONTENT.classList.toggle("show");
}

function handleDropdownClick(event) {
  if (event.target.tagName === "A") {
    currentData = event.target.getAttribute("data");
    CURRENT_SORT.textContent = currentData;
    drawGraph();
    DROPDOWN_CONTENT.classList.remove("show");
  }
}

function handleCountryClick(event, d) {
  clickedCountry = d.properties.name;
  COUNTRY_LABEL.textContent = clickedCountry;
  drawGraph();
}

function handleCountryMouseOver(event, d) {
  d3.select(this).attr("fill", "orange");
  tooltip
    .style("display", "block")
    .attr("transform", `translate(${event.pageX},${event.pageY - 20})`);
  tooltip.select("text").text(d.properties.name);

  tooltip.raise();
}

function handleCountryMouseOut(event, d) {
  d3.select(this).attr("fill", "rgba(8, 81, 156, 0.6)");
  tooltip.style("display", "none");
}

function handleZoom(event) {
  zoomGroup.attr("transform", event.transform);
}

async function drawGraph() {
  // brisanje starog bar charta
  d3.select("#container2").select("svg").remove();

  const graphWidth = window.innerWidth * 0.5; 
  const graphHeight = window.innerHeight * 0.9;
  // kreiranje novog bar charta
  const svg2 = d3
    .select("#container2")
    .append("svg")
    .attr("width", graphWidth)
    .attr("height", graphHeight);

  // učitavanje podataka
  const jsonFile = `/data/${currentData}/json/${clickedCountry}.json`;
  const data = await d3.json(jsonFile);

  // izabiranje godine
  const year =
    currentData === "import"
      ? `Imported value in ${selectedYear}`
      : `Exported value in ${selectedYear}`;

  // filtiriranje podataka za izabranu godinu
  const filteredData = data.filter(
    (d) => d.Code !== "TOTAL" && d[year] !== undefined
  );

  // soriiranje podataka
  filteredData.sort((a, b) => b[year] - a[year]);

  // izdvajanje prvih 10 podataka
  const topData = filteredData.slice(0, 10);


  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(topData, (d) => d[year])])
    .range([0, graphWidth - 300]); 
  const yScale = d3
    .scaleBand()
    .domain(topData.map((d) => d["Product label"]))
    .range([50, graphHeight - 200]) 
    .padding(0.1);

  const xAxis = d3.axisBottom(xScale).tickFormat((d) => d);
  const yAxis = d3.axisLeft(yScale);

  // dodavanje x osi na svg
  svg2
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(150, ${graphHeight - 200})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .style("font-size", "14px")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)");

  // dodavanje y osi na svg
  svg2
    .append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(150,0)")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "14px");
  // linije
  svg2
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(150, ${graphHeight - 200})`)
    .attr("opacity", 0.1)
    .call(
      d3
        .axisBottom(xScale)
        .tickSize(-graphHeight + 250)
        .tickFormat("")
    );
  // naslov za x os
  svg2
    .append("text")
    .attr("class", "x axis")
    .attr("transform", `translate(${graphWidth * 0.8}, ${graphHeight - 100})`)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Value in $ thousands");

  //naslov za y os
  svg2
    .append("text")
    .attr("class", "y axis")
    .attr("transform", `translate(100, ${25}) `)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Products");

  // bar chart 
  const bars = svg2
    .selectAll(".bar")
    .data(topData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 151)
    .attr("y", (d) => {
      const barHeight = yScale.bandwidth() * 0.8; 
      return yScale(d["Product label"]) + (yScale.bandwidth() - barHeight) / 2;
    })
    .attr("width", (d) => xScale(d[year]))
    .attr("height", yScale.bandwidth() * 0.8) 
    .attr("fill", "steelblue");

  // labela za bar chart
  const labels = svg2
    .selectAll(".label")
    .data(topData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d[year]) + 155)
    .attr("y", (d) => yScale(d["Product label"]) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text((d) => d[year])
    .attr("fill", "black");
}
