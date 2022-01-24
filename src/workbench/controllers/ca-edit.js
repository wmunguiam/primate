'use strict';

/**
 * Provides controller constructor for editing CA certificates.
 *
 * @constructor
 *
 * @param {Window} window - Top level window object.
 * @param {Object} scope - Injected scope object.
 * @param {Object} location - Injected Angular location service.
 * @param {function} location.path - Tells the current view path.
 * @param {{
 *     caId: string
 * }} routeParams - Object containing route parameters.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function TrustedCAEditController(window, scope, location, routeParams, restClient, viewFrame, toast) {
    const {angular} = window;
    const restConfig = {method: 'POST', endpoint: '/ca_certificates'};

    const formCa = angular.element('form#ca-ed__frm01');

    scope.caId = '__none__';
    scope.caModel = {cert: '', cert_digest: '', tags: []};

    switch (routeParams.caId) {
        case '__create__':
            viewFrame.setTitle('Add CA Certificate');
            break;

        default:
            restConfig.method = 'PATCH';
            restConfig.endpoint = `${restConfig.endpoint}/${routeParams.caId}`;

            scope.caId = routeParams.caId;

            viewFrame.setTitle('Edit CA Certificate');
            break;
    }

    /**
     * Builds CA  certificate object from the model and submits the form.
     *
     * @param {Event} event - The current event object.
     * @returns {boolean} False always.
     */
    scope.submitCAForm = function (event) {
        event.preventDefault();

        if (scope.caModel.cert.length <= 10) {
            formCa.find('textarea#cf-ed__txa01').focus();
            return false;
        }

        const payload = Object.assign({}, scope.caModel);

        if (scope.caModel.cert_digest.length <= 10) {
            delete payload.cert_digest;
        }

        const request = restClient.request({method: restConfig.method, endpoint: restConfig.endpoint, data: payload});

        request.then(({data: response}) => {
            switch (scope.caId) {
                case '__none__':
                    toast.success('New CA certificate added.');
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info('CA certificate details updated.');
                    break;
            }
        });

        request.catch(() => {
            toast.error('Unable to save CA certificate details.');
        });

        return false;
    };

    /* Load the CA certificate details if a valid certificate id is provided. */
    if (restConfig.method === 'PATCH' && scope.caId !== '__none__') {
        const request = restClient.get(restConfig.endpoint);

        viewFrame.setLoaderStep(100);
        request.then(({data: response}) => {
            for (let key of Object.keys(response)) {
                if (typeof scope.caModel[key] === 'undefined') {
                    continue;
                }

                if (response[key] === null) {
                    scope.caModel[key] = '';
                    continue;
                }

                scope.caModel[key] = response[key];
            }

            viewFrame.addAction('Delete', '#!/certificates', 'btn critical delete', 'CA certificate', `/ca_certificates/${scope.caId}`);
        });

        request.catch(() => {
            toast.error('Could not load CA details');
            window.location.href = '#!/certificates';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    }

    viewFrame.addRoute('#!/certificates');
}