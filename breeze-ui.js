// Generated by CoffeeScript 1.4.0
(function() {
  var BusRouteLayer, BusStopLayer, DistanceLayer, Layer, RentalsLayer, busRouteLayer, busStopLayer, distanceLayer, headerToggle, loadBusRoutes, loadRentals, map, polymaps, recordEvent, recordOutboundLink, rentalLayer, setVariable, setupDistanceSlider, setupPriceSlider, setupRoomsSlider, setupSharedCheckbox, toggleAdditional, trackEvent,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  trackEvent = function(name, values, callback) {
    if (callback == null) {
      callback = null;
    }
    mixpanel.track(name, values);
    if (callback) {
      return callback();
    }
  };

  recordOutboundLink = function(link, name, values) {
    recordEvent(name, values.source, values.url);
    return trackEvent(name, values, function() {
      return window.open(link.href, "_blank");
    });
  };

  window.recordOutboundLink = recordOutboundLink;

  recordEvent = function(category, action, label) {
    return _gat._getTrackerByName()._trackEvent(category, action, label);
  };

  window.recordEvent = recordEvent;

  setVariable = function(index, name, value) {
    return _gaq.push(["_setCustomVar", index, name, value, 2]);
  };

  window.setVariable = setVariable;

  if (Modernizr.svg && Modernizr.inlinesvg) {
    if ($(window).height() < 500 || $(window).width() < 500) {
      $(".desktop").hide();
    }
    if (Modernizr.touch) {
      $(".github").hide();
    }
    $(".header").show();
    headerToggle = function(element) {
      if ($("#standard-options").is(":visible")) {
        $("#standard-options").hide("slow");
        $(element).button("option", "icons", {
          primary: "ui-icon-triangle-1-s"
        });
        return trackEvent('hid options');
      } else {
        $("#standard-options").show("slow");
        $(element).button("option", "icons", {
          primary: "ui-icon-triangle-1-n"
        });
        return trackEvent('show options');
      }
    };
    $(".header-expand").button({
      icons: {
        primary: "ui-icon ui-icon-triangle-1-n"
      },
      text: false
    }).click(function() {
      return headerToggle(this);
    });
    toggleAdditional = function() {
      if ($("#additional-notices").is(":visible")) {
        $("#additional-notices").hide("slow");
        $("a#additional-expand").text("additional notices");
        return trackEvent('hid notices');
      } else {
        $("#additional-notices").show("slow");
        $("a#additional-expand").text("less notices");
        return trackEvent('show notices');
      }
    };
    $("a#additional-expand").click(function() {
      return toggleAdditional();
    });
    polymaps = org.polymaps;
    map = polymaps.map().container(d3.select("#map").append("svg:svg").attr("width", "100%").attr("height", "100%").node()).zoom(13).center({
      lat: 48.455164,
      lon: -123.351059
    }).add(polymaps.drag()).add(polymaps.wheel().smooth(false)).add(polymaps.dblclick()).add(polymaps.arrow()).add(polymaps.touch());
    map.add(polymaps.image().url(polymaps.url("http://tile.stamen.com/toner/{Z}/{X}/{Y}.png")));
    Layer = (function() {

      Layer.prototype.zoomLevel = function() {
        return this.map.zoom();
      };

      Layer.prevZoom = 13;

      Layer.distance = 0;

      Layer.prototype.pixelDistance = function() {
        var p0, p1;
        p0 = this.map.pointLocation({
          x: 0,
          y: 0
        });
        p1 = this.map.pointLocation({
          x: 1,
          y: 1
        });
        this.distance = {
          lat: Math.abs(p0.lat - p1.lat),
          lon: Math.abs(p0.lon - p1.lon)
        };
        return this.distance;
      };

      function Layer(map) {
        var _this = this;
        this.map = map;
        this.transform = __bind(this.transform, this);

        this.selector = d3.select("#map svg").insert("svg:g");
        this.map.on("move", function() {
          return _this.update();
        });
        this.map.on("resize", function() {
          return _this.update();
        });
      }

      Layer.prototype.transform = function(location) {
        var d;
        d = this.map.locationPoint(location);
        return "translate(" + d.x + "," + d.y + ")";
      };

      Layer.prototype.cluster = function(elements, distance) {
        var aStop, cluster, clustered, currentElements, distLat, distLon, i, pixelDistance, stop;
        currentElements = elements.slice(0);
        pixelDistance = this.pixelDistance();
        distLat = distance * pixelDistance.lat;
        distLon = distance * pixelDistance.lon;
        clustered = [];
        while (currentElements.length > 0) {
          stop = currentElements.shift();
          cluster = [];
          cluster.push(stop);
          i = 0;
          while (i < currentElements.length) {
            if (Math.abs(currentElements[i].lat - stop.lat) < distLat && Math.abs(currentElements[i].lon - stop.lon) < distLon) {
              aStop = currentElements.splice(i, 1);
              cluster.push(aStop[0]);
              i--;
            }
            i++;
          }
          clustered.push(cluster);
        }
        return clustered;
      };

      Layer.prototype.filter = function(clusters, distance) {
        var bRight, cluster, output, tLeft;
        tLeft = this.map.pointLocation({
          x: 0 - distance,
          y: 0 - distance
        });
        bRight = this.map.pointLocation({
          x: $(window).width() + distance,
          y: $(window).height() + distance
        });
        output = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = clusters.length; _i < _len; _i++) {
            cluster = clusters[_i];
            if (bRight.lat <= cluster[0].lat && cluster[0].lat <= tLeft.lat && tLeft.lon <= cluster[0].lon && cluster[0].lon <= bRight.lon) {
              _results.push(cluster);
            }
          }
          return _results;
        })();
        return output;
      };

      return Layer;

    })();
    DistanceLayer = (function(_super) {
      var clusters, distanceInMeters, prevLocalClusters, stops;

      __extends(DistanceLayer, _super);

      function DistanceLayer() {
        return DistanceLayer.__super__.constructor.apply(this, arguments);
      }

      stops = [];

      clusters = [];

      prevLocalClusters = [];

      DistanceLayer.prototype.update = function() {
        var marker,
          _this = this;
        if (this.zoomLevel() !== this.prevZoom || (this.stops && this.prevNumStops !== this.stops.length)) {
          this.prevNumStops = this.stops.length;
          this.prevZoom = this.zoomLevel();
          this.clusters = this.cluster(this.stops, 10);
        }
        this.localClusters = this.filter(this.clusters, this.distanceInPixels());
        if ((!this.prevLocalClusters) || this.prevLocalClusters !== this.localClusters) {
          this.prevLocalClusters = this.localClusters;
          marker = this.selector.selectAll("g").data(this.localClusters);
          marker.enter().append("g").append("circle").attr("class", "reach").attr('r', this.distanceInPixels());
          marker.exit().remove();
          this.updateCircleRadius();
        }
        return this.selector.selectAll("g").attr("transform", function(cluster) {
          return _this.transform(cluster[0]);
        });
      };

      distanceInMeters = ($.cookie("distance") ? $.cookie("distance") : 500);

      DistanceLayer.prototype.distanceInMeters = function() {
        if (arguments.length === 0) {
          return distanceInMeters;
        } else {
          distanceInMeters = arguments[0];
          $.cookie("distance", distanceInMeters, {
            expires: 30
          });
          setVariable(1, "Distance", distanceInMeters.toString());
          this.updateCircleRadius();
          return this;
        }
      };

      DistanceLayer.prototype.distanceInPixels = function() {
        var pixelsPerKm;
        pixelsPerKm = this.map.locationPoint({
          lat: 0,
          lon: 0.008983
        }).x - this.map.locationPoint({
          lat: 0,
          lon: 0
        }).x;
        return this.distanceInMeters() / 1000 * pixelsPerKm;
      };

      DistanceLayer.prototype.updateCircleRadius = function() {
        return this.selector.selectAll("circle.reach").attr('r', this.distanceInPixels());
      };

      DistanceLayer.prototype.addStops = function(stops) {
        stops.sort(function(a, b) {
          return a.lat - b.lat;
        });
        this.stops = stops;
        return this.update();
      };

      return DistanceLayer;

    })(Layer);
    BusRouteLayer = (function(_super) {
      var svgLine;

      __extends(BusRouteLayer, _super);

      function BusRouteLayer() {
        return BusRouteLayer.__super__.constructor.apply(this, arguments);
      }

      svgLine = d3.svg.line().x(function(d) {
        return d.x;
      }).y(function(d) {
        return d.y;
      }).interpolate("linear");

      BusRouteLayer.prototype.update = function() {
        var _this = this;
        return this.selector.selectAll("path").attr("d", function(d) {
          return _this.line(d);
        });
      };

      BusRouteLayer.prototype.addRoutes = function(routes, stops) {
        var stopsById,
          _this = this;
        stopsById = {};
        stops.forEach(function(stop) {
          return stopsById[stop.id] = stop;
        });
        this.line = function(route) {
          var _this = this;
          return svgLine(route.stops.map(function(routeStop) {
            return _this.map.locationPoint(stopsById[routeStop.point_id]);
          }));
        };
        return this.selector.selectAll("g").data(routes).enter().append("path").attr("class", "route").attr("d", function(d) {
          return _this.line(d);
        });
      };

      return BusRouteLayer;

    })(Layer);
    BusStopLayer = (function(_super) {
      var clusters, prevLocalClusters, prevNumStops, stops;

      __extends(BusStopLayer, _super);

      function BusStopLayer() {
        return BusStopLayer.__super__.constructor.apply(this, arguments);
      }

      clusters = [];

      stops = [];

      prevNumStops = 0;

      prevLocalClusters = [];

      BusStopLayer.prototype.update = function() {
        var marker,
          _this = this;
        if (this.zoomLevel() !== this.prevZoom || (this.stops && this.prevNumStops !== this.stops.length)) {
          if (this.prevZoom && this.zoomLevel() !== this.prevZoom) {
            trackEvent('Zoom level changed', {
              'Zoom level': this.zoomLevel()
            });
          }
          this.prevNumStops = this.stops.length;
          this.prevZoom = this.zoomLevel();
          this.clusters = this.cluster(this.stops, 10);
        }
        this.localClusters = this.filter(this.clusters, 10);
        if ((!this.prevLocalClusters) || this.localClusters !== this.prevLocalClusters) {
          marker = this.selector.selectAll("g").data(this.localClusters);
          marker.select('circle').attr('r', function(cluster) {
            if (cluster.length > 1) {
              return 5;
            } else {
              return 3.5;
            }
          }).attr("text", this.representCluster);
          marker.enter().append("g").append("circle").attr("class", "stop no-tip").attr('r', function(cluster) {
            if (cluster.length > 1) {
              return 5;
            } else {
              return 3.5;
            }
          }).attr("text", this.representCluster);
          marker.exit().remove();
        }
        return this.selector.selectAll("g").attr("transform", function(cluster) {
          return _this.transform(cluster[0]);
        });
      };

      BusStopLayer.prototype.representCluster = function(cluster) {
        var i, route, routes, stop, _i, _j, _len, _len1, _ref;
        routes = [];
        for (_i = 0, _len = cluster.length; _i < _len; _i++) {
          stop = cluster[_i];
          _ref = stop.routes;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            route = _ref[_j];
            routes.push(route);
          }
        }
        routes = routes.sort();
        routes = (function() {
          var _k, _len2, _results;
          _results = [];
          for (i = _k = 0, _len2 = routes.length; _k < _len2; i = ++_k) {
            route = routes[i];
            if (i = 0 || route !== routes[i - 1]) {
              _results.push(route);
            }
          }
          return _results;
        })();
        routes = routes.sort(function(a, b) {
          return parseInt(a.match(/^\d+/)[0]) - parseInt(b.match(/^\d+/)[0]);
        });
        return "<ul>" + ((function() {
          var _k, _len2, _results;
          _results = [];
          for (_k = 0, _len2 = routes.length; _k < _len2; _k++) {
            route = routes[_k];
            _results.push("<li>" + route + "</li>");
          }
          return _results;
        })()).join("") + "</ul>";
      };

      BusStopLayer.prototype.addStops = function(stops) {
        stops.sort(function(a, b) {
          return a.lat - b.lat;
        });
        this.stops = stops;
        if (!Modernizr.touch) {
          $(".stop").live("mouseover", function(event) {
            return $(this).qtip({
              overwrite: false,
              content: {
                attr: 'text'
              },
              show: {
                event: event.type,
                ready: true
              },
              hide: 'mouseout'
            }, event);
          });
        }
        return this.update();
      };

      return BusStopLayer;

    })(Layer);
    RentalsLayer = (function(_super) {
      var allowShared, priceRange, roomsRange;

      __extends(RentalsLayer, _super);

      function RentalsLayer() {
        this.rentalClass = __bind(this.rentalClass, this);
        return RentalsLayer.__super__.constructor.apply(this, arguments);
      }

      RentalsLayer.prototype.viewedIndices = ($.cookie("viewed-listings") ? JSON.parse($.cookie("viewed-listings")) : new Object());

      RentalsLayer.prototype.rentalClass = function(rental, i) {
        if (this.viewedIndices.hasOwnProperty(rental.id)) {
          if (rental.updated_at > this.viewedIndices[rental.id]) {
            delete this.viewedIndices[rental.id];
            return "rental";
          } else {
            return "rental rental-viewed";
          }
        } else {
          return "rental";
        }
      };

      priceRange = ($.cookie("priceLow") && $.cookie("priceHigh") ? [$.cookie("priceLow"), $.cookie("priceHigh")] : [0, 3000]);

      RentalsLayer.prototype.priceRange = function() {
        if (arguments.length === 0) {
          return priceRange;
        } else {
          priceRange = arguments[0];
          $.cookie("priceLow", priceRange[0], {
            expires: 30
          });
          $.cookie("priceHigh", priceRange[1], {
            expires: 30
          });
          setVariable(2, "Price Low", priceRange[0].toString());
          setVariable(3, "Price High", priceRange[1].toString());
          this.updateVisibility();
          return this;
        }
      };

      roomsRange = ($.cookie("roomsLow") && $.cookie("roomsHigh") ? [$.cookie("roomsLow"), $.cookie("roomsHigh")] : [0, 5]);

      RentalsLayer.prototype.roomsRange = function() {
        if (arguments.length === 0) {
          return roomsRange;
        } else {
          roomsRange = arguments[0];
          $.cookie("roomsLow", roomsRange[0], {
            expires: 30
          });
          $.cookie("roomsHigh", roomsRange[1], {
            expires: 30
          });
          setVariable(4, "Min Rooms", roomsRange[0].toString());
          setVariable(5, "Max Rooms", roomsRange[1].toString());
          this.updateVisibility();
          return this;
        }
      };

      allowShared = ($.cookie("showShared") ? $.cookie("showShared") === "true" : false);

      RentalsLayer.prototype.allowShared = function() {
        if (arguments.length === 0) {
          return allowShared;
        } else {
          allowShared = arguments[0];
          $.cookie("showShared", allowShared, {
            expires: 30
          });
          this.updateVisibility();
          return this;
        }
      };

      RentalsLayer.prototype.isNotSharedOrAllowed = function(rental) {
        var match;
        match = /shared|room/i.test(rental.type);
        if (match) {
          return allowShared;
        } else {
          return true;
        }
      };

      RentalsLayer.prototype.updateVisibility = function() {
        var _this = this;
        return this.selector.selectAll("rect").attr('visibility', function(rentals) {
          var suite, suites;
          suites = (function() {
            var _i, _len, _ref, _ref1, _ref2, _results;
            _ref = rentals.availabilities;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              suite = _ref[_i];
              if (suite && (priceRange[0] <= (_ref1 = suite.price) && _ref1 <= priceRange[1]) && (roomsRange[0] <= (_ref2 = suite.bedrooms) && _ref2 <= roomsRange[1])) {
                _results.push(suite);
              }
            }
            return _results;
          })();
          if (suites.length > 0) {
            if (_this.isNotSharedOrAllowed(rentals)) {
              return 'visible';
            } else {
              return 'hidden';
            }
          } else {
            return 'hidden';
          }
        });
      };

      RentalsLayer.prototype.update = function() {
        this.selector.selectAll("g").attr("transform", this.transform);
        return $(".rental").qtip('reposition');
      };

      RentalsLayer.prototype.convertDateToUTC = function(date) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
      };

      RentalsLayer.prototype.setListingDisplay = function(rental) {
        var listings, output, suite;
        listings = (function() {
          var _i, _len, _ref, _results;
          _ref = rental.availabilities;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            suite = _ref[_i];
            _results.push("<li>" + (suite.bedrooms || suite.bedrooms === 0 ? suite.bedrooms : "unknown") + " bedroom: " + (suite.price > 0 ? "$" + suite.price : "Unknown") + "</li>");
          }
          return _results;
        })();
        output = "";
        if (rental.image_url) {
          output = output + "<a href=\"" + rental.url + "\" target=\"_blank\" onClick=\"recordOutboundLink(this, 'Outbound Links', {\"source\":\"" + rental.source + "\", \"url\":\"" + rental.url + "\"})\"><img class=\"rental-img\" src=\"" + rental.image_url + "\"></a>";
        }
        output = output + rental.source + ", " + rental.type + " <br/><ul>" + listings.join("") + "</ul><br /><a href=\"" + rental.url + "\" target=\"_blank\" onClick=\"recordOutboundLink(this, 'Outbound Links', {'source':'" + rental.source + "', 'url':'" + rental.url + "'});return false;\">View Original Listing</a>";
        return output;
      };

      RentalsLayer.prototype.addRentals = function(rentals) {
        var marker,
          _this = this;
        marker = this.selector.selectAll("g").data(rentals).enter().append("g").attr("transform", this.transform);
        marker.append("rect").attr("class", this.rentalClass).attr("x", -8 / 2).attr("y", -8 / 2).attr('height', 8).attr('width', 8).attr("text", function(rental) {
          return _this.setListingDisplay(rental);
        });
        this.updateVisibility();
        marker.on("click", function(rental, i) {
          _this.viewedIndices[rental.id] = new Date() * 1;
          $.cookie("viewed-listings", JSON.stringify(_this.viewedIndices), {
            expires: 30
          });
          _this.selector.selectAll("g").select("rect").attr("class", _this.rentalClass);
          recordEvent('Rental View', rental.source, rental.url);
          return trackEvent('Rental View', {
            "Rental Source": rental.source,
            "url": rental.url,
            "min price": priceRange[0],
            "max price": priceRange[1],
            "min rooms": roomsRange[0],
            "max rooms": roomsRange[1],
            "shared allowed": allowShared,
            "zoom level": _this.zoomLevel()
          });
        });
        return $(".rental").qtip({
          content: {
            attr: 'text',
            title: {
              text: 'Rental Details',
              button: true
            }
          },
          show: 'mousedown',
          hide: false,
          position: {
            my: 'bottom center',
            at: 'top center'
          },
          style: 'ui-tooltip-tipped'
        });
      };

      return RentalsLayer;

    })(Layer);
    distanceLayer = new DistanceLayer(map);
    busRouteLayer = new BusRouteLayer(map);
    busStopLayer = new BusStopLayer(map);
    rentalLayer = new RentalsLayer(map);
    setupDistanceSlider = function() {
      var sliderChanged;
      sliderChanged = function(value) {
        $("#slider-distance > .value").html(value + "m");
        return distanceLayer.distanceInMeters(value);
      };
      $("#slider-distance-element").slider({
        range: "min",
        value: distanceLayer.distanceInMeters(),
        step: 10,
        min: 0,
        max: 2500,
        slide: function(event, ui) {
          return sliderChanged(ui.value);
        },
        stop: function(event, ui) {
          return trackEvent('distance changed', {
            distance: distanceLayer.distanceInMeters()
          });
        }
      });
      return sliderChanged($("#slider-distance-element").slider("value"));
    };
    setupPriceSlider = function() {
      var sliderChanged;
      sliderChanged = function(values) {
        $("#slider-price > .value").html("$" + values[0] + " - " + values[1]);
        return rentalLayer.priceRange(values);
      };
      $("#slider-price-element").slider({
        range: true,
        values: rentalLayer.priceRange(),
        step: 50,
        min: 0,
        max: 3000,
        slide: function(event, ui) {
          return sliderChanged(ui.values);
        },
        stop: function(event, ui) {
          return trackEvent('price changed', {
            'low price': rentalLayer.priceRange()[0],
            'high price': rentalLayer.priceRange()[1]
          });
        }
      });
      return sliderChanged($("#slider-price-element").slider("values"));
    };
    setupRoomsSlider = function() {
      var sliderChanged;
      sliderChanged = function(values) {
        $("#slider-rooms > .value").html(values[0] + " - " + values[1] + " rooms");
        return rentalLayer.roomsRange(values);
      };
      $("#slider-rooms-element").slider({
        range: true,
        values: rentalLayer.roomsRange(),
        min: 0,
        max: 5,
        slide: function(event, ui) {
          return sliderChanged(ui.values);
        },
        stop: function(event, ui) {
          return trackEvent('# rooms changed', {
            'min rooms': rentalLayer.roomsRange()[0],
            'max rooms': rentalLayer.roomsRange()[1]
          });
        }
      });
      return sliderChanged($("#slider-rooms-element").slider("values"));
    };
    setupSharedCheckbox = function() {
      $("#show-shared").attr('checked', rentalLayer.allowShared());
      return $("#show-shared").click(function() {
        rentalLayer.allowShared(this.checked);
        if (this.checked) {
          return trackEvent('shared selected');
        } else {
          return trackEvent('private selected');
        }
      });
    };
    loadBusRoutes = function() {
      return d3.json('data/uvic_transit.json', function(json) {
        distanceLayer.addStops(json.stops);
        busRouteLayer.addRoutes(json.routes, json.stops);
        return busStopLayer.addStops(json.stops);
      });
    };
    loadRentals = function() {
      return d3.json('data/rentals.json', function(json) {
        return rentalLayer.addRentals(json);
      });
    };
    (function() {
      setupDistanceSlider();
      setupPriceSlider();
      setupRoomsSlider();
      setupSharedCheckbox();
      loadBusRoutes();
      loadRentals();
      return trackEvent('RentalMap loaded');
    })();
    $(window).unload(function() {
      return trackEvent('RentalMap closed');
    });
    addthis.addEventListener('addthis.menu.share', function(evt) {
      return trackEvent('AddThis', evt.data);
    });
    $("a[rel*='external']").click(function() {
      var link;
      link = $(this);
      recordEvent('External Link', link.text(), link.attr('href'));
      return trackEvent('External Link', {
        "Link Text": link.text(),
        "url": link.attr('href')
      });
    });
    $("#loading").hide();
  } else {
    $('#unsupportedBrowser').show();
    $('.regular').hide();
    recordEvent('Unsupported Browser', 'No SVG', navigator.userAgent);
    trackEvent('Unsupported Browser', {
      "Browser": navigator.userAgent
    });
  }

}).call(this);
