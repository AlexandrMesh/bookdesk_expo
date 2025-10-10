import React from 'react';
import { Dimensions, View } from 'react-native';
import { AdRequest, AdTheme, BannerAdSize, BannerView, Gender, Location } from 'yandex-mobile-ads';

const BannerAd: React.FC = () => {
  const [adSize, setAdSize] = React.useState<any>(null);
  const [adRequest] = React.useState(
    new AdRequest({
      age: '20',
      contextQuery: 'context-query',
      contextTags: ['context-tag'],
      gender: Gender.Male,
      location: new Location(55.734202, 37.588063),
      adTheme: AdTheme.Dark,
      parameters: new Map<string, string>([
        ['param1', 'value1'],
        ['param2', 'value2'],
      ]),
    }),
  );

  React.useEffect(() => {
    (async () => {
      const size = await BannerAdSize.stickySize(Dimensions.get('window').width);
      setAdSize(size);
    })();
  }, []);

  if (!adSize) return <View />;

  return (
    <BannerView
      size={adSize}
      adUnitId='demo-banner-yandex'
      adRequest={adRequest}
      onAdLoaded={() => {}}
      onAdFailedToLoad={() => {}}
      onAdClicked={() => {}}
      onLeftApplication={() => {}}
      onReturnToApplication={() => {}}
      onAdImpression={() => {}}
      onAdClose={() => {}}
    />
  );
};

export default BannerAd;
