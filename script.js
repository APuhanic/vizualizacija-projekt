// Define constants
const SLIDER = document.getElementById("year-slider");
const YEAR_LABEL = document.getElementById("year-label");
const COUNTRY_LABEL = document.getElementById("country-label");
const SORT_BUTTON = document.querySelector(".data-button");
const DROPDOWN_CONTENT = document.querySelector(".dropdown-content");
const CURRENT_SORT = document.querySelector(".current-data");

// Define variables
let currentData = "export";
let selectedYear = 2022; // Set the default year
let clickedCountry = "croatia";

// Define SVG dimensions
const width = window.innerWidth * 0.5;
const height = window.innerHeight;

// Define map projection
const projection = d3
  .geoMercator()
  .center([10, 55])
  .translate([width / 2, height / 2])
  .scale([width / 1.3]);

// Define path generator
const path = d3.geoPath().projection(projection);

// Create SVG
const svg = d3
  .select("#container")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background-color", "rgba(8, 81, 156, 0.2)");

// Create a group for zoomable elements
const zoomGroup = svg.append("g");

// Add event listeners
SLIDER.addEventListener("input", handleSliderInput);
SORT_BUTTON.addEventListener("click", toggleDropdown);
DROPDOWN_CONTENT.addEventListener("click", handleDropdownClick);

// Load GeoJSON data
d3.json("europe_features.json").then(function (json) {
  const countries = zoomGroup
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

  // Enable zoom and panning
  const zoom = d3.zoom().on("zoom", handleZoom);
  svg.call(zoom);

  // Draw initial graph
  drawGraph();
});

// Event handlers
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
  svg
    .append("text")
    .attr("class", "country-label")
    .attr("x", 10)
    .attr("y", 20)
    .text(d.properties.name);
}

function handleCountryMouseOut(event, d) {
  d3.select(this).attr("fill", "rgba(8, 81, 156, 0.6)");
  svg.select(".country-label").remove();
}

function handleZoom(event) {
  zoomGroup.attr("transform", event.transform);
}

async function drawGraph() {
  // Remove existing SVG for the bar chart
  d3.select("#container2").select("svg").remove();

  const graphWidth = window.innerWidth * 0.5; // Adjust the width as desired
  const graphHeight = window.innerHeight * 0.9; // Adjust the height as desired

  // Create new SVG for the bar chart
  const svg2 = d3
    .select("#container2")
    .append("svg")
    .attr("width", graphWidth)
    .attr("height", graphHeight)
    .style("background-color", "rgba(118, 81, 156, 0.2)");

  // Load the data from the corresponding JSON file
  const jsonFile = `/data/${currentData}/json/${clickedCountry}.json`;
  const data = await d3.json(jsonFile);

  // Choose the year you want to visualize (e.g., 2022)
  const year =
    currentData === "import"
      ? `Imported value in ${selectedYear}`
      : `Exported value in ${selectedYear}`;

  // Filter the data for the selected year
  const filteredData = data.filter(
    (d) => d.Code !== "TOTAL" && d[year] !== undefined
  );

  // Sort the filtered data by value in descending order
  filteredData.sort((a, b) => b[year] - a[year]);

  // Extract the top 10 entries from the filtered data
  const topData = filteredData.slice(0, 10);

  // Create scales for the x and y axes
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(topData, (d) => d[year])])
    .range([0, graphWidth - 200]); // Adjust the range to fit within the SVG

  const yScale = d3
    .scaleBand()
    .domain(topData.map((d) => d["Product label"]))
    .range([50, graphHeight - 200]) // Adjust the range to fit within the SVG
    .padding(0.1);

  // Create x and y axes
  const xAxis = d3.axisBottom(xScale).tickFormat((d) => d);
  const yAxis = d3.axisLeft(yScale);

  // Append x axis to the SVG
  svg2
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(100, ${graphHeight - 200})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .style("font-size", "14px")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)");

  // Append y axis to the SVG
  svg2
    .append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(100,0)")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "14px");

  // Create horizontal bars
  const bars = svg2
    .selectAll(".bar")
    .data(topData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 100)
    .attr("y", (d) => {
      const barHeight = yScale.bandwidth() * 0.8; // Adjust the factor as desired
      return yScale(d["Product label"]) + (yScale.bandwidth() - barHeight) / 2;
    })
    .attr("width", (d) => xScale(d[year]))
    .attr("height", yScale.bandwidth() * 0.8) // Adjust the factor as desired
    .attr("fill", "steelblue");

  // Add labels to the bars
  const labels = svg2
    .selectAll(".label")
    .data(topData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d[year]) + 105)
    .attr("y", (d) => yScale(d["Product label"]) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text((d) => d[year])
    .attr("fill", "black");
}
