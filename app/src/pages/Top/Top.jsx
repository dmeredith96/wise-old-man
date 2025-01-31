import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Helmet } from 'react-helmet';
import {
  Period,
  PERIODS,
  METRICS,
  PLAYER_BUILDS,
  PLAYER_TYPES,
  MetricProps,
  COUNTRY_CODES
} from '@wise-old-man/utils';
import { useUrlContext } from 'hooks';
import { PageTitle } from 'components';
import { deltasActions } from 'redux/deltas';
import URL from 'utils/url';
import { Controls, List } from './containers';
import { TopContext } from './context';
import './Top.scss';

function Top() {
  const dispatch = useDispatch();

  const { context, updateContext } = useUrlContext(encodeContext, decodeURL);
  const { metric, type, build, country } = context;

  const reloadList = () => {
    PERIODS.forEach(period => {
      dispatch(deltasActions.fetchLeaderboards(metric, period, type, build, country));
    });
  };

  useEffect(reloadList, [metric, type, build, country]);

  return (
    <TopContext.Provider value={{ context, updateContext }}>
      <div className="top__container container">
        <Helmet>
          <title>{`${MetricProps[metric].name} current top`}</title>
        </Helmet>
        <div className="top__header row">
          <div className="col">
            <PageTitle title="Current Top" />
          </div>
        </div>
        <div className="top__filters row">
          <Controls />
        </div>
        <div className="top__list row">
          <div className="col-lg-4 col-md-6">
            <List period={Period.DAY} />
          </div>
          <div className="col-lg-4 col-md-6">
            <List period={Period.WEEK} />
          </div>
          <div className="col-lg-4 col-md-6">
            <List period={Period.MONTH} />
          </div>
          <div className="col-lg-4 col-md-6">
            <List period={Period.FIVE_MIN} />
          </div>
          <div className="col-lg-4 col-md-6">
            <List period={Period.YEAR} />
          </div>
        </div>
      </div>
    </TopContext.Provider>
  );
}

function encodeContext({ metric, type, build, country }) {
  const nextURL = new URL(`/top`);

  if (metric && metric !== 'overall' && METRICS.includes(metric)) {
    nextURL.appendToPath(`/${metric}`);
  }

  if (type && PLAYER_TYPES.includes(type.toLowerCase())) {
    nextURL.appendSearchParam('type', type.toLowerCase());
  }

  if (build && PLAYER_BUILDS.includes(build.toLowerCase())) {
    nextURL.appendSearchParam('build', build.toLowerCase());
  }

  if (country && COUNTRY_CODES.includes(country)) {
    nextURL.appendSearchParam('country', country);
  }

  return nextURL.getPath();
}

function decodeURL(params, query) {
  const { metric } = params;
  const { type, build, country } = query;

  const isValidMetric = metric && METRICS.includes(metric.toLowerCase());
  const isValidType = type && PLAYER_TYPES.includes(type.toLowerCase());
  const isValidBuild = build && PLAYER_BUILDS.includes(build.toLowerCase());
  const isValidCountry = country && COUNTRY_CODES.includes(country.toUpperCase());

  return {
    metric: isValidMetric ? metric.toLowerCase() : 'overall',
    type: isValidType ? type.toLowerCase() : null,
    build: isValidBuild ? build.toLowerCase() : null,
    country: isValidCountry ? country.toUpperCase() : null
  };
}

export default Top;
