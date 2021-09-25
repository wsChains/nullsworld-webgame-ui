import { MyNulls } from '@/backends/TypeDefine'
import { get } from '@/backends/base'



export default {
    /** 
     * @param {{address: string, status: string | number}} params 
     * @return {Promise<import('axios').AxiosResponse<MyNulls.list>>}
     **/
    list(params) {
        return get('pet', { params })
    },

    /** 
     * @param {{petId: number}} params
     * @return {Promise<import('axios').AxiosResponse<MyNulls.petDetail>>}
     **/
    petDetail(params) {
        return get('pet/findDetails', { params })
    }
}
