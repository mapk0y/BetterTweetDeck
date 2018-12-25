import React, {Component} from 'react';
import {Portal} from 'react-portal';

import {ChirpHandlerPayload} from '../modules/chirpHandler';
import {TweetDeckColumnMediaPreviewSizesEnum} from '../modules/columnMediaSizes';
import {findProviderForUrl, getThumbnailData} from '../thumbnails';
import {BTDThumbnailDataResults, BTDUrlProviderResultTypeEnum} from '../thumbnails/types';
import {LargeThumbnail, MediumThumbnail, SmallThumbnail, ThumbnailProps} from './mediaThumbnails';

interface TweetThumbnailProps {
  chirpData: ChirpHandlerPayload;
}

interface TweetThumbnailState {
  urlData?: BTDThumbnailDataResults;
}

export class TweetThumbnail extends Component<TweetThumbnailProps, TweetThumbnailState> {
  constructor(props: TweetThumbnailProps) {
    super(props);

    this.state = {};
  }

  async componentDidMount() {
    const {urls} = this.props.chirpData;

    // Find a suitable URL for thumbnails.
    const urlToConsider = urls.find(u => !u.type && !u.expanded_url.includes('twitter.com'));

    if (!urlToConsider) {
      return;
    }

    // Find a suitable provider for the URL.
    const provider = findProviderForUrl(urlToConsider.expanded_url);

    if (!provider) {
      return;
    }

    // Fetch the thumbnail data using the provider.
    const results = await getThumbnailData(urlToConsider.expanded_url, provider);

    if (results.type === BTDUrlProviderResultTypeEnum.ERROR) {
      return;
    }

    // Add that data in the state.
    this.setState({
      urlData: results
    });
  }

  private renderThumbnail(baseNode: Element, urlData: BTDThumbnailDataResults) {
    const {columnMediaSize, uuid} = this.props.chirpData;
    const thumbProps: ThumbnailProps = {
      url: urlData.url,
      imageUrl: urlData.thumbnailUrl
    };

    if (columnMediaSize === TweetDeckColumnMediaPreviewSizesEnum.LARGE) {
      const node = document.querySelector(`[data-btd-uuid="${uuid}"] .js-stream-item-content`);
      if (!node) {
        return null;
      }

      return (
        <Portal node={node}>
          <LargeThumbnail {...thumbProps} />
        </Portal>
      );
    }

    if (columnMediaSize === TweetDeckColumnMediaPreviewSizesEnum.MEDIUM) {
      return (
        <Portal node={baseNode}>
          <MediumThumbnail {...thumbProps} />
        </Portal>
      );
    }

    return (
      <Portal node={baseNode}>
        <SmallThumbnail {...thumbProps} />
      </Portal>
    );
  }

  render() {
    const {urlData} = this.state;

    // If we don't have any data (yet), nothing to do.
    if (!urlData) {
      return null;
    }

    const {chirpData} = this.props;
    const {uuid, columnMediaSize} = chirpData;

    if (columnMediaSize === TweetDeckColumnMediaPreviewSizesEnum.OFF) {
      return null;
    }

    const baseNode = document.querySelector(`[data-btd-uuid="${uuid}"] .js-tweet.tweet .tweet-body`);

    if (!baseNode) {
      return null;
    }

    return this.renderThumbnail(baseNode, urlData);
  }
}