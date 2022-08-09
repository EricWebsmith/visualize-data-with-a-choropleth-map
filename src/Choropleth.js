import { useEffect, useRef } from "react"
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { us } from './us';
import { education } from "./education";

export default function Choropleth() {

  const d3Chart = useRef();

  useEffect(() => {
    const svg = d3.select(d3Chart.current);
    svg
      .style('background-color', 'white')
      .attr('height', 600)
      .attr('width', 960)

    const body = d3.select('body');
    const tooltip = body
      .append('div')
      .attr('class', 'tooltip')
      .attr('id', 'tooltip')
      .style('opacity', 0);

    const path = d3.geoPath();
    const x = d3.scaleLinear()
      .domain([2.6, 75.1]).rangeRound([600, 860]);

    // legend
    const color = d3
      .scaleThreshold()
      .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
      .range(d3.schemeGreens[9]);

    const g = svg.append('g')
      .attr('class', 'key')
      .attr('id', 'legend')
      .attr('transform', 'translate(0, 40)');

    g.selectAll('rect')
      .data(
        color.range().map(d => {
          d = color.invertExtent(d);
          if (d[0] === null) {
            d[0] = x.domain()[0];
          }
          if (d[1] === null) {
            d[1] = x.domain()[1];
          }

          return d;
        })
      )
      .enter()
      .append('rect')
      .attr('height', 8)
      .attr('x', d => x(d[0]))
      .attr('width', d => d[0] && d[1] ? x(d[1]) - x(d[0]) : x(null))
      .attr('fill', d => color(d[0]));

    g.append('text')
      .attr('class', 'caption')
      .attr('x', x.range()[0])
      .attr('y', -6)
      .attr('fill', '#000')
      .attr('text-anchor', 'start')
      .attr('font-weight', 'bold');

    g.call(
      d3
        .axisBottom(x)
        .tickSize(13)
        .tickFormat(function (x) {
          return Math.round(x) + '%';
        })
        .tickValues(color.domain())
    )
      .select('.domain')
      .remove();

    svg
      .append('g')
      .attr('class', 'counties')
      .selectAll('path')
      .data(topojson.feature(us, us.objects.counties).features)
      .enter()
      .append('path')
      .attr('class', 'county')
      .attr('data-fips', function (d) {
        return d.id;
      })
      .attr('data-education', function (d) {
        var result = education.filter(function (obj) {
          return obj.fips === d.id;
        });
        if (result[0]) {
          return result[0].bachelorsOrHigher;
        }
        // could not find a matching fips id in the data
        console.log('could find data for: ', d.id);
        return 0;
      })
      .attr('fill', function (d) {
        var result = education.filter(function (obj) {
          return obj.fips === d.id;
        });
        if (result[0]) {
          return color(result[0].bachelorsOrHigher);
        }
        // could not find a matching fips id in the data
        return color(0);
      })
      .attr('d', path)
      .on('mouseover', function (event, d) {
        tooltip.style('opacity', 0.9);
        tooltip
          .html(function () {
            var result = education.filter(function (obj) {
              return obj.fips === d.id;
            });
            if (result[0]) {
              return (
                result[0]['area_name'] +
                ', ' +
                result[0]['state'] +
                ': ' +
                result[0].bachelorsOrHigher +
                '%'
              );
            }
            // could not find a matching fips id in the data
            return 0;
          })
          .attr('data-education', function () {
            var result = education.filter(function (obj) {
              return obj.fips === d.id;
            });
            if (result[0]) {
              return result[0].bachelorsOrHigher;
            }
            // could not find a matching fips id in the data
            return 0;
          })
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        tooltip.style('opacity', 0);
      });

      // svg
      // .append('path')
      // .datum(
      //   topojson.mesh(us, us.objects.states, function (a, b) {
      //     return a !== b;
      //   })
      // )
      // .attr('class', 'states')
      // .attr('d', path);
  }, []);



  return (
    <div className="main">
      <div className="container">
        <h1 id='title'>United States Educational Attainment</h1>
        <p>Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)</p>
        <div className="visHolder">
          <svg ref={d3Chart}></svg>
        </div>
      </div>
    </div>
  )
}