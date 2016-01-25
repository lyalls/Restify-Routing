'use strict'

var legalMethods = ['get', 'put', 'post', 'del', 'patch', 'head', 'delete'];

var routerPrototype = {
    legalMethods: legalMethods,
    use(path, subRouter){
        subRouter.path = path;
        subRouter.server = this.server;
        subRouter.setChildrenServer(this.server);
        subRouter.parent = this;
        if(!this.children) this.children = [];
        this.children.push(subRouter);
        if(this.server){
            subRouter.activeAll();
        }
    },
    setChildrenServer(server){
        if(!this.children)return;
        for(var child of this.children){
           child.server = server;
           child.setChildrenServer(server);
        }
    },
    activeAll(){
        this.activeAllPaths();
        if(!this.children)return;
        for(var child of this.children){
            child.activeAll();
        }
    },
    activeAllPaths(){
        if(!this.server) return;
        if(this.actions){
            for(var param of this.actions) {
                this.active(param.method, param.path, param.callback);
            }
        }
    },
    active(method, path, cb){
        if(!this.server || !path || !cb) return;
        var p = (this.fullPath()+path).replace(/\/\//g, '/');
        this.server[method](p, cb);

        var m = method.toUpperCase();
        if(m === 'DEL') m =  'DELETE';
        console.log('[Route] method: '+m+', path: '+p)
    },
    fullPath(){
        var fp = this.path;
        var x = this.parent;
        while(x){
            fp = x.path + fp;
            x= x.parent;
        }
        if(fp) fp = fp.replace(/\/\//g, '/');
        return fp;
    }
};

for(var method of legalMethods){
    var restifyMethod = method;
    if(method==='delete') restifyMethod = 'del';
    routerPrototype[method] = function(path, cb){
        if(!this.actions) this.actions = [];
        this.actions.push({
            method: restifyMethod,
            path: path,
            callback: cb
        });
        if(this.server){
            this.active(restifyMethod, path, cb);
        }
    }
}

function Router(serverInstance) {
    if(serverInstance) this.server = serverInstance;
    this.path = '/';
    this.parent = null;
}

Router.prototype = routerPrototype;

module.exports = Router;