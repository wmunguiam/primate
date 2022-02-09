/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../../lib/core-toolkit.js';
import {urlQuery, urlOffset} from '../../lib/rest-utils.js';

/**
 * Provides controller constructor for listing routes.
 *
 * @constructor
 *
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function RouteListController(scope, restClient, viewFrame, toast) {
    scope.routeList = [];
    scope.routeNext = {offset: ''};

    /**
     * Retrieves the list of route objects.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchRouteList = function (filters = null) {
        const request = restClient.get('/routes' + urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.routeNext.offset = urlOffset(response.next);

            for (let route of response.data) {
                route.displayText = typeof route.name === 'string' ? route.name : _.objectName(route.id);
                route.protocols = Array.isArray(route.protocols) ? route.protocols.join(', ').toUpperCase() : 'None';

                scope.routeList.push(route);
            }
        });

        request.catch(() => {
            toast.error('Could not load list of routes.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle('Routes');
    viewFrame.addBreadcrumb('#!/routes', 'Routes');
    viewFrame.addAction('New Route', '#!/routes/__create__');

    scope.fetchRouteList();
}
