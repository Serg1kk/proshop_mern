import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Table } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'

const FeatureFlagListScreen = ({ history }) => {
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        setLoading(true)
        setError('')

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }

        const { data } = await axios.get('/api/feature-flags', config)
        setFeatures(data)
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message
        )
      } finally {
        setLoading(false)
      }
    }

    if (userInfo && userInfo.isAdmin) {
      fetchFeatureFlags()
    } else {
      history.push('/login')
    }
  }, [history, userInfo])

  return (
    <>
      <h1>Dashboard Features</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <Table striped bordered hover responsive className='table-sm'>
          <thead>
            <tr>
              <th>NAME</th>
              <th>STATUS</th>
              <th>TRAFFIC %</th>
              <th>LAST MODIFIED</th>
              <th>DEPENDS ON</th>
              <th>DESCRIPTION</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.key}>
                <td>{feature.name}</td>
                <td>{feature.status}</td>
                <td>{feature.traffic_percentage}</td>
                <td>{feature.last_modified}</td>
                <td>
                  {feature.depends_on && feature.depends_on.length
                    ? feature.depends_on.join(', ')
                    : '-'}
                </td>
                <td>{feature.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}

export default FeatureFlagListScreen
